import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface SwnEventBusProps {
  publisherFunction: NodejsFunction;
  targetFunction: NodejsFunction;
}
export class SwnEventBus extends Construct {
  constructor(scope: Construct, id: string, props: SwnEventBusProps) {
    super(scope, id);

    const bus = new EventBus(this, 'SwnEventBus', {
      eventBusName: 'SwnEventBus',
    });

    const checkoutBasketRule = new Rule(this, 'CheckoutBasketRule', {
      eventBus: bus,
      enabled: true,
      description: 'When Basket microservice cheout the basket',
      eventPattern: {
        source: ['com.swn.basket.checkoutbasket'],
        detailType: ['CheckoutBasket'],
      },
      ruleName: 'CheckoutBasketRule',
    });

    checkoutBasketRule.addTarget(new LambdaFunction(props.targetFunction));

    bus.grantPutEventsTo(props.publisherFunction);
  }
}
