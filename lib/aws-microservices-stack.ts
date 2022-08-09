import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SwnDatabase } from './database';
import { SwnMicroservices } from './microservice';
import { SwnApiGateway } from './apigateway';
import { SwnEventBus } from './eventbus';
import { SwnQueue } from './queue';

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, 'Database');
    const productTable = database.productTable;
    const basketTable = database.basketTable;
    const orderTable = database.orderTable;

    const microservices = new SwnMicroservices(this, 'Microservice', {
      productTable,
      basketTable,
      orderTable,
    });
    const productFunction = microservices.productFunction;
    const basketFunction = microservices.basketFunction;
    const orderingFunction = microservices.orderingFunction;

    const apigateway = new SwnApiGateway(this, 'ApiGateway', {
      productFunction: productFunction,
      basketFunction: basketFunction,
      orderingFunction: orderingFunction,
    });

    const queue = new SwnQueue(this, 'OrderQueue', {
      consumer: microservices.orderingFunction,
    });

    const eventbus = new SwnEventBus(this, 'EventBus', {
      publisherFunction: microservices.basketFunction,
      targetQueue: queue.orderQueue,
    });
  }
}
