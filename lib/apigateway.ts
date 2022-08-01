import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface SwnApiGatewayProps {
  productFunction: IFunction;
  basketFunction: IFunction;
}

export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
    super(scope, id);
    this.createProductApi(props.productFunction);
    this.createBasketApi(props.basketFunction);
  }
  createProductApi(productFn: IFunction) {
    const apigw = new LambdaRestApi(this, 'productApi', {
      restApiName: 'ProductServiceApi',
      handler: productFn,
      proxy: false,
    });

    const productPath = apigw.root.addResource('product');
    // path: /product
    productPath.addMethod('GET');
    productPath.addMethod('POST');

    // path: /product/{id}
    const singleProduct = productPath.addResource('{id}');
    singleProduct.addMethod('GET');
    singleProduct.addMethod('PUT');
    singleProduct.addMethod('DELETE');
  }

  createBasketApi(basketFn: IFunction) {
    const apigw = new LambdaRestApi(this, 'basketApi', {
      restApiName: 'BasketServiceApi',
      handler: basketFn,
      proxy: false,
    });

    const basket = apigw.root.addResource('basket');
    // path: /basket
    basket.addMethod('GET');
    basket.addMethod('POST');

    // path: /basket/{userName}
    const singleBasket = basket.addResource('{id}');
    singleBasket.addMethod('GET');
    singleBasket.addMethod('DELETE');

    // path: /basket/checkout
    const basketCheckout = basket.addResource('checkout');
    basketCheckout.addMethod('POST');
  }
}
