import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';
import { ebClient } from './eventBridgeClient';

exports.handler = async function (event) {
  console.log('request:', JSON.stringify(event, undefined, 2));

  try {
    let body;
    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters != null) {
          body = await getBasket(event.pathParameters.username);
        } else {
          body = await getAllBaskets();
        }
        break;
      case 'POST':
        if (event.path === '/basket/checkout') {
          body = await checkoutBasket(event);
        } else {
          body = await createBasket(event);
        }
        break;
      case 'DELETE':
        body = await deleteBasket(event.pathParameters.username);
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body,
      }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to perform operation.',
        errorMsg: e.message,
        errorStack: e.stack,
      }),
    };
  }
};

const getBasket = async (username) => {
  console.log('getBasket');

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ username }),
    };

    const { Item } = await ddbClient.send(new GetItemCommand(params));

    console.log(Item);

    return Item ? unmarshall(Item) : {};
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const getAllBaskets = async () => {
  console.log('getAllBaskets');

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);

    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (error) {
    console.log(e);
    throw e;
  }
};

const createBasket = async (event) => {
  console.log(`createBasket, with event: `, event);
  try {
    const requestBody = JSON.parse(event.body);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));

    console.log(createResult);
    return createResult;
  } catch (error) {
    console.log(e);
    throw e;
  }
};

const deleteBasket = async (username) => {
  console.log('deleteBasket');
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ username }),
    };

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));

    console.log(deleteResult);
    return deleteResult;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const checkoutBasket = async (event) => {
  console.log('checkoutBasket');

  // implement function
  // publish an event to eventbridge - this will subcribe by order microservice
  // and start ordering process.

  const checkoutRequest = JSON.parse(event.body);
  if (!checkoutRequest || !checkoutRequest.username) {
    throw new Error(
      `username should exist in checkoutRequest: "${checkoutRequest}"`
    );
  }
  // 1- Get existing basket with the items
  const basket = await getBasket(checkoutRequest.username);

  // 2- create an event json object with basket items,
  // calculate total price, prepare order creatte json data to send ordering ms
  const checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

  // 3- publish an event to eventbridge - this will subscribe by order microservice
  const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);

  // 4- remove existing basket
  await deleteBasket(checkoutRequest.username);
};

const prepareOrderPayload = (checkoutRequest, basket) => {
  console.log('prepareOrderPayload');

  // prepare order payload -> calculate total price and combine checkouteRequest and
  // aggregate and enrich request and basket data in order to create order pauyload
  try {
    if (!basket || !basket.items) {
      throw new Error(`basket shoul exist in items: "${basket}"`);
    }

    // calculate total price
    let totalPrice = 0;
    basket.items.forEach((item) => (totalPrice += item.price));
    checkoutRequest.totalPrice = totalPrice;
    console.log(checkoutRequest);

    // copies all properties from basket into checkoutRequest
    Object.assign(checkoutRequest, basket);
    console.log('Success prepreOrderPayload, orderPayload:', checkoutRequest);
    return checkoutRequest;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const publishCheckoutBasketEvent = async (checkoutPayload) => {
  console.log('publishCheckoutBasketEvent with payload:', checkoutPayload);
  try {
    const params = {
      Entries: [
        {
          Source: process.env.EVENT_SOURCE,
          Detail: JSON.stringify(checkoutPayload),
          DetailType: process.env.EVENT_DETAILTYPE,
          Resources: [],
          EventBusName: process.env.EVENT_BUSNAME,
        },
      ],
    };

    const data = await ebClient.send(new PutEventsCommand(params));

    console.log('Success, event sent; requestID:', data);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
