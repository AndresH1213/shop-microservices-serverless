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
}

export class SwnMicroservices extends Construct {
  public readonly productFunction: NodejsFunction;
  public readonly basketFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
    super(scope, id);

    this.productFunction = this.createFunction('product', {
      name: props.productTable.tableName,
      pk: 'id',
    });
    props.productTable.grantReadWriteData(this.productFunction);
    this.basketFunction = this.createFunction('basket', {
      name: props.basketTable.tableName,
      pk: 'userName',
    });
    props.productTable.grantReadWriteData(this.productFunction);
  }

  createFunction(name: string, table: { name: string; pk: string }) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        PRIMARY_KEY: table.pk,
        DYNAMODB_TABLE_NAME: table.name,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    return new NodejsFunction(this, `${name}LambdaFunction`, {
      ...nodeJsFunctionProps,
      entry: join(__dirname, `../src/${name}/index.js`),
    });
  }
}
