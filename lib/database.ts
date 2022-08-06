import { RemovalPolicy, Stack } from 'aws-cdk-lib';
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
  public readonly orderTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.productTable = this.createTable('product', 'id');
    this.basketTable = this.createTable('basket', 'username');
    this.orderTable = this.createTable('order', 'username', 'orderDate');
  }

  createTable(name: string, pk: string, sk?: string) {
    let sortKey = sk ? { name: sk, type: AttributeType.STRING } : undefined;
    return new Table(this, name, {
      partitionKey: {
        name: pk,
        type: AttributeType.STRING,
      },
      sortKey,
      tableName: name,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}
