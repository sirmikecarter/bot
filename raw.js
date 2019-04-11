// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { LuisRecognizer } = require('botbuilder-ai');
// Import AdaptiveCard content.
const { CardFactory } = require('botbuilder');

// LUIS intent names. you can get this from the .lu file.
const CREATE_RAW_INTENT = 'Create_RAW';
const GET_FORECAST_INTENT = 'Get_Weather_Forecast';
const NONE_INTENT = 'None';

// LUIS entity names.
const LOCATION_ENTITY = 'Location';
const LOCATION_PATTERNANY_ENTITY = 'Location_PatternAny';

// this is the LUIS service type entry in the .bot file.
const WEATHER_LUIS_CONFIGURATION = 'RAW';

const InputFormCard = require('./bots/resources/InputFormCard.json');
const InputsCard = require('./bots/resources/InputsCard.json');
const RawInputForm = require('./bots/resources/RawInputForm.json');
const LargeWeatherCard = require('./bots/resources/LargeWeatherCard.json');

class Raw {
    /**
     *

     */
    constructor() {

        this.luisRecognizer = new LuisRecognizer({
            applicationId: process.env.RAWAppId,
            azureRegion: process.env.RAWRegion,
            // CAUTION: Authoring key is used in this example as it is appropriate for prototyping.
            // When implimenting for deployment/production, assign and use a subscription key instead of an authoring key.
            endpointKey: process.env.RAWAuthoringKey
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
        // Get location entity if available.
        const locationEntity = (LOCATION_ENTITY in weatherResults.entities) ? weatherResults.entities[LOCATION_ENTITY][0] : undefined;
        const locationPatternAnyEntity = (LOCATION_PATTERNANY_ENTITY in weatherResults.entities) ? weatherResults.entities[LOCATION_PATTERNANY_ENTITY][0] : undefined;
        // Depending on intent, call "Turn On" or "Turn Off" or return unknown.

        console.log(topWeatherIntent)

        switch (topWeatherIntent) {
        case CREATE_RAW_INTENT:
            //await turnContext.sendActivity(`You asked for current weather condition in Location = ` + (locationEntity || locationPatternAnyEntity));
            await turnContext.sendActivity({
                text: 'Here you go, just need a few more details to submit your RAW request',
                attachments: [CardFactory.adaptiveCard(RawInputForm)]
              });
            break;
        case NONE_INTENT:
        default:
            await turnContext.sendActivity(`Weather dialog cannot fulfill this request.`);
        }
    }
};

module.exports.Raw = Raw;
