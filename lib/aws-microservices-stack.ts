import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SwnDatabase } from './database';
import { SwnMicroservices } from './microservice';
import { SwnApiGateway } from './apigateway';

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, 'Database');
    const productTable = database.productTable;
    const basketTable = database.basketTable;

    const microservices = new SwnMicroservices(this, 'Microservice', {
      productTable,
      basketTable,
    });
    const productFunction = microservices.productFunction;
    const basketFunction = microservices.basketFunction;

    const apigateway = new SwnApiGateway(this, 'ApiGateway', {
      productFunction: productFunction,
      basketFunction: basketFunction,
    });
  }
}
