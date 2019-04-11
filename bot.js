// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { LuisRecognizer } = require('botbuilder-ai');
const { ActivityTypes } = require('botbuilder');
//const { HomeAutomation } = require('./homeAutomation');
const { Weather } = require('./weather');
const { QnA } = require('./qna');
const { Raw } = require('./raw');
const { Approval } = require('./approval');
const path = require('path');

// this is the LUIS service type entry in the .bot file.
const DISPATCH_CONFIG = 'nlp-with-dispatchDispatch';

// LUIS intent names. you can get this from the dispatch.lu file.
const HOME_AUTOMATION_INTENT = 'l_Home_Automation';
const WEATHER_INTENT = 'l_Weather';
const NONE_INTENT = 'None';
const QNA_INTENT = 'q_q_sample-qna';
const RAW_INTENT = 'l_RAW';
const APPROVAL_INTENT = 'l_ProductApprovals';
const APPROVAL_INTENT1 = 'q_approvals';

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Import AdaptiveCard content.
const { CardFactory } = require('botbuilder');

const FlightItineraryCard = require('./bots/resources/FlightItineraryCard.json');
const ImageGalleryCard = require('./bots/resources/ImageGalleryCard.json');
const LargeWeatherCard = require('./bots/resources/LargeWeatherCard.json');
const RestaurantCard = require('./bots/resources/RestaurantCard.json');
const SolitaireCard = require('./bots/resources/SolitaireCard.json');
const SportingEventCard = require('./bots/resources/SportingEventCard.json');
const StockUpdateCard = require('./bots/resources/StockUpdateCard.json');
const ProductVideoCard = require('./bots/resources/ProductVideoCard.json');
const InputFormCard = require('./bots/resources/InputFormCard.json');
const InputsCard = require('./bots/resources/InputsCard.json');
const FoodOrderCard = require('./bots/resources/FoodOrderCard.json');
const WeatherCompactCard = require('./bots/resources/WeatherCompactCard.json');
const WelcomeCard = require('./bots/resources/WelcomeCard.json');

// Create array of AdaptiveCard content, this will be used to send a random card to the user.
const CARDS = [
    FlightItineraryCard,
    ImageGalleryCard,
    LargeWeatherCard,
    RestaurantCard,
    SolitaireCard,
    SportingEventCard,
    StockUpdateCard,
    ProductVideoCard,
    InputFormCard,
    InputsCard,
    FoodOrderCard,
    WeatherCompactCard,
    WelcomeCard
];

class DispatchBot {
    /**
     *
     * @param {ConversationState}  conversation state
     * @param {UserState} user state
     */
    constructor(conversationState, userState) {
        if (!conversationState) throw new Error(`Missing parameter. Conversation state parameter is missing`);
        if (!userState) throw new Error(`Missing parameter. User state parameter is missing`);


        //this.homeAutomationDialog = new HomeAutomation(conversationState, userState);
        this.weatherDialog = new Weather();
        this.qnaDialog = new QnA();
        this.rawDialog = new Raw();
        this.approvalDialog = new Approval();

        this.conversationState = conversationState;
        this.userState = userState;

        // dispatch recognizer

        this.luisRecognizer = new LuisRecognizer({
            applicationId: process.env.DispatchAppId,
            azureRegion: process.env.DispatchRegion,
            // CAUTION: Authoring key is used in this example as it is appropriate for prototyping.
            // When implimenting for deployment/production, assign and use a subscription key instead of an authoring key.
            endpointKey: process.env.DispatchAuthoringKey
        });
    }

    /**
     * Driver code that does one of the following:
     * 1. Calls dispatch LUIS model to determine intent
     * 2. Calls appropriate sub component to drive the conversation forward.
     *
     * @param {TurnContext} context turn context from the adapter
     */
    async onTurn(turnContext) {

        if (turnContext.activity.type === ActivityTypes.Message) {
            // determine which dialog should fulfill this request
            // call the dispatch LUIS model to get results.

            //await this.dispatchRecognizer.recognize(turnContext)

            const dispatchResults = await this.luisRecognizer.recognize(turnContext);
            const dispatchTopIntent = LuisRecognizer.topIntent(dispatchResults);

            console.log(dispatchTopIntent)

            //const dispatchTopIntent = WEATHER_INTENT

            //console.log(HOME_AUTOMATION_INTENT)

            switch (dispatchTopIntent) {
            case WEATHER_INTENT:
                await this.weatherDialog.onTurn(turnContext);
                break;
            case QNA_INTENT:
                await this.qnaDialog.onTurn(turnContext);
                break;
            case RAW_INTENT:
                await this.rawDialog.onTurn(turnContext);
                break;
            case APPROVAL_INTENT:
                await this.approvalDialog.onTurn(turnContext);
                break;
            case APPROVAL_INTENT1:
                await this.approvalDialog.onTurn(turnContext);
                break;
            case NONE_INTENT:
            default:
                // Unknown request
                await turnContext.sendActivity(`I do not understand that.`);
                //await turnContext.sendActivity(`I can help with weather forecast, turning devices on and off and answer general questions like 'hi', 'who are you' etc.`);
            }

            // save state changes
            await this.conversationState.saveChanges(turnContext);
            await this.userState.saveChanges(turnContext);
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // Handle ConversationUpdate activity type, which is used to indicates new members add to
            // the conversation.
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

            // Do we have any new members added to the conversation?
            if (turnContext.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in turnContext.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message
                    // the 'bot' is the recipient for events from the channel,
                    // turnContext.activity.membersAdded == turnContext.activity.recipient.Id indicates the
                    // bot was added to the conversation.
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        // Welcome user.
                        // When activity type is "conversationUpdate" and the member joining the conversation is the bot
                        // we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
                        // To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
                        //await turnContext.sendActivity(`Hello, this is R2-D2 - your virtual assistant.`);
                        //await turnContext.sendActivity(`I can help you submit a Request for Architecture Work (RAW), check the weather forecast, answer your questions about CalPERS or even carry on a converstation with you`);
                        //await turnContext.sendActivity(`What can I help with you today?`);
                        const randomlySelectedCard = CARDS[Math.floor((Math.random() * CARDS.length - 1) + 1)];

                        await turnContext.sendActivity({
                            //text: '',
                            attachments: [CardFactory.adaptiveCard(WelcomeCard)]
                          });



                    }
                }
            }
        }
    }
}

module.exports.DispatchBot = DispatchBot;
