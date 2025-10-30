#!/bin/bash

## Get the name of the workflow and the related pipeline number
curl --header "Circle-Token: $CIRCLECI_API_KEY" --request GET "https://circleci.com/api/v2/workflow/${CIRCLE_WORKFLOW_ID}" -o current_workflow.json
WF_NAME=$(jq -r '.name' current_workflow.json)
CURRENT_PIPELINE_NUM=$(jq -r '.pipeline_number' current_workflow.json)

## Get the IDs of pipelines on the same branch. (Only consider pipelines that have a pipeline number inferior to the current pipeline)
PIPE_IDS=$(curl --header "Circle-Token: $CIRCLECI_API_KEY" --request GET "https://circleci.com/api/v2/project/circleci/$CIRCLE_ORGANIZATION_ID/$CIRCLE_PROJECT_ID/pipeline?branch=$CIRCLE_BRANCH"|jq -r --argjson CURRENT_PIPELINE_NUM "$CURRENT_PIPELINE_NUM" '.items[]|select(.state == "created")|select(.number < $CURRENT_PIPELINE_NUM)|.id')

## Get the IDs of currently running/on_hold workflows that have the same name as the current workflow, in all previously created pipelines.
if [ ! -z "$PIPE_IDS" ]; then
  for PIPE_ID in $PIPE_IDS
  do
    curl --header "Circle-Token: $CIRCLECI_API_KEY" --request GET "https://circleci.com/api/v2/pipeline/${PIPE_ID}/workflow"|jq -r --arg WF_NAME "${WF_NAME}" '.items[]|select(.status == "on_hold" or .status == "running") | select(.name == $WF_NAME) | .id' >> WF_to_cancel.txt
  done
fi

## Cancel any currently queued workflows with the same name, on the same branch, and that have the Queue step actively running (meaning job is queued)
if [ -s WF_to_cancel.txt ]; then
  while read WF_ID;
    do
      JOB_BUILD_NUM=$(curl --header "Circle-Token: $CIRCLECI_API_KEY" --request GET "https://circleci.com/api/v2/workflow/$WF_ID/job" | jq -r '.items[]|select(.name == "pytest-and-build") | .job_number')
      QUEUE_STEP_STATUS=$(curl --header "Circle-Token: $CIRCLECI_API_KEY" https://circleci.com/api/v1.1/project/circleci/$CIRCLE_ORGANIZATION_ID/$CIRCLE_PROJECT_ID/$JOB_BUILD_NUM | jq -r '.steps[] | select(.name == "Queue Until Front of Line") | .actions[] | select(.name == "Queue Until Front of Line") | .status')
      if [ "$QUEUE_STEP_STATUS" == "running" ]; then
        echo "Found redundent pipeline to cancel!"
        echo "Cancelling workflow $WF_ID, build number $JOB_BUILD_NUM..."
        curl --header "Circle-Token: $CIRCLECI_API_KEY" --request POST https://circleci.com/api/v2/workflow/$WF_ID/cancel
      fi
    done < WF_to_cancel.txt
  ## Allowing some time to complete the cancellation
  sleep 2
else
  echo "Nothing to cancel"
fi