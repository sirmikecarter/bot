// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');
// Import AdaptiveCard content.
const { CardFactory } = require('botbuilder');

// LUIS intent names. you can get this from the .lu file.
const GET_CONDITION_INTENT = 'Approved';
const NONE = 'None';

// LUIS entity names.
const LOCATION_ENTITY = 'Location';
const LOCATION_PATTERNANY_ENTITY = 'Application';

// this is the LUIS service type entry in the .bot file.
const WEATHER_LUIS_CONFIGURATION = 'ProductApprovals';

// Name of the QnA Maker service in the .bot file.
const QNA_CONFIGURATION = 'approvals';
// CONSTS used in QnA Maker query. See [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-qna?view=azure-bot-service-4.0&tabs=cs) for additional info
const QNA_TOP_N = 1;
const QNA_CONFIDENCE_THRESHOLD = 0.5;




class Approval {
    /**
     *

     */
    constructor() {

        this.luisRecognizer = new LuisRecognizer({
            applicationId: process.env.ProductApprovalsAppId,
            azureRegion: process.env.ProductApprovalsRegion,
            // CAUTION: Authoring key is used in this example as it is appropriate for prototyping.
            // When implimenting for deployment/production, assign and use a subscription key instead of an authoring key.
            endpointKey: process.env.ProductApprovalsAuthoringKey
        });

        // add recognizers

        this.qnaRecognizer = new QnAMaker({
            knowledgeBaseId: process.env.ApprovalsKBId,
            endpointKey: process.env.ApprovalsEndpointKey,
            host: process.env.ApprovalsHostname
        });



    }
    /**
     *
     * @param {TurnContext} turn context object
     */
    async onTurn(turnContext) {
        // Call weather LUIS model.
        const weatherResults = await this.luisRecognizer.recognize(turnContext);
        const topWeatherIntent = LuisRecognizer.topIntent(weatherResults);

        //console.log(topWeatherIntent)

        // Get location entity if available.
        const locationEntity = weatherResults.entities;
        const locationPatternAnyEntity = (LOCATION_PATTERNANY_ENTITY in weatherResults.entities) ? weatherResults.entities[LOCATION_PATTERNANY_ENTITY][0] : undefined;
        // Depending on intent, call "Turn On" or "Turn Off" or return unknown.

        switch (topWeatherIntent) {
        case GET_CONDITION_INTENT:
        const qnaResult = await this.qnaRecognizer.generateAnswer(locationPatternAnyEntity, QNA_TOP_N, QNA_CONFIDENCE_THRESHOLD);
        if (!qnaResult || qnaResult.length === 0 || !qnaResult[0].answer) {

          const qnaResult1 = await this.qnaRecognizer.generateAnswer(turnContext.activity.text, QNA_TOP_N, QNA_CONFIDENCE_THRESHOLD);
          if (!qnaResult1 || qnaResult1.length === 0 || !qnaResult1[0].answer) {
              await turnContext.sendActivity(`Not an approved Product`);
              return;
          }
          // respond with qna result
          await turnContext.sendActivity(qnaResult1[0].answer);
          break;

        }
        // respond with qna result
        await turnContext.sendActivity(qnaResult[0].answer);
        break;
        case NONE:
        const qnaResult1 = await this.qnaRecognizer.generateAnswer(turnContext.activity.text, QNA_TOP_N, QNA_CONFIDENCE_THRESHOLD);
        if (!qnaResult1 || qnaResult1.length === 0 || !qnaResult1[0].answer) {
            await turnContext.sendActivity(`Not an approved Product`);
            return;
        }
        // respond with qna result
        await turnContext.sendActivity(qnaResult1[0].answer);
        break;
        }
    }
};

module.exports.Approval = Approval;
