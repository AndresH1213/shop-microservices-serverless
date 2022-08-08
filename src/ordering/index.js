import {
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from './ddbClient';

exports.handler = async function (event) {
  console.log('request:', JSON.stringify(event, undefined, 2));
  if (event.Records) {
    await sqsInvocation(event);
  } else if (event['detail-type']) {
    // Eventbridge Invocation
    await eventBridgeInvocation(event);
  } else {
    // API Gateway Invocation -- return sync response
    return await apiGatewayInvocation(event);
  }
};

const sqsInvocation = async (event) => {
  console.log(`sqsInvoication function. Event: "${event}`);
  event.Records.forEach(async (record) => {
    console.log('Record: %j', record);

    const checkoutEventRequest = JSON.parse(record.body);
    await createOrder(checkoutEventRequest.detail);
  });
};
const eventBridgeInvocation = async (event) => {
  const basket = event.detail;

  // create order item into db
  await createOrder(basket);
};

const apiGatewayInvocation = async (event) => {
  let body;
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters != null) {
          body = await getOrder(event);
        } else {
          body = await getAllOrders(event);
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    console.log(body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Failed to perform operation',
      }),
    };
  }
};

const createOrder = async (basketCheckoutEvent) => {
  try {
    console.log(`createOrder function. Event: "${basketCheckoutEvent}"`);

    // set orderDate for SK of order dynamodb
    const orderDate = new Date().toISOString();
    basketCheckoutEvent.orderDate = orderDate;
    console.log(basketCheckoutEvent);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketCheckoutEvent || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);
    return createResult;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getOrder = async (event) => {
  console.log('getOrder');

  try {
    const username = event.pathParameters.username;
    const orderDate = event.queryStringParameter.orderDate;

    const params = {
      KeyConditionExpression: 'username = :username and orderDate = :orderDate',
      ExpressionAttributeValues: {
        ':username': { S: username },
        ':orderDate': { S: orderDate },
      },
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new QueryCommand(params));

    console.log(Items);
    return Items.map((item) => unmarshall(item));
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getAllOrders = async () => {
  console.log('getAllOrders');
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};
