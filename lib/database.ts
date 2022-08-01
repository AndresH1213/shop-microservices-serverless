import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class SwnDatabase extends Construct {
  public readonly productTable: ITable;
  public readonly basketTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.productTable = this.createTable('product', 'id');
    this.basketTable = this.createTable('basket', 'username');
  }

  createTable(name: string, pk: string, sk?: string) {
    return new Table(this, name, {
      partitionKey: {
        name: pk,
        type: AttributeType.STRING,
      },
      tableName: name,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}
