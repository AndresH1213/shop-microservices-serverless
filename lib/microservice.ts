import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

interface SwnMicroservicesProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}

export class SwnMicroservices extends Construct {
  public readonly productFunction: NodejsFunction;
  public readonly basketFunction: NodejsFunction;
  public readonly orderingFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
    super(scope, id);

    this.productFunction = this.createFunction('product', {
      DYNAMODB_TABLE_NAME: props.productTable.tableName,
      PRIMARY_KEY: 'id',
    });
    props.productTable.grantReadWriteData(this.productFunction);
    this.basketFunction = this.createFunction('basket', {
      DYNAMODB_TABLE_NAME: props.basketTable.tableName,
      PRIMARY_KEY: 'userName',
      EVENT_SOURCE: 'com.swn.basket.checkoutbasket',
      EVENT_DETAILTYPE: 'CheckoutBasket',
      EVENT_BUSNAME: 'SwnEventBus',
    });
    props.basketTable.grantReadWriteData(this.basketFunction);
    this.orderingFunction = this.createFunction('ordering', {
      DYNAMODB_TABLE_NAME: props.orderTable.tableName,
      PRIMARY_KEY: 'userName',
      SORT_KEY: 'orderDate',
    });
    props.orderTable.grantReadWriteData(this.orderingFunction);
  }

  createFunction(name: string, environmentVariables: any) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: environmentVariables,
      runtime: Runtime.NODEJS_16_X,
    };

    return new NodejsFunction(this, `${name}LambdaFunction`, {
      ...nodeJsFunctionProps,
      entry: join(__dirname, `../src/${name}/index.js`),
    });
  }
}
