import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';

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
      headers: { 'Content-Type': 'text/plain' },
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
  } catch (error) {
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
  // publish an event to eventbridge - this will subcribe by oreder microservice
  // and start ordering process.
};
