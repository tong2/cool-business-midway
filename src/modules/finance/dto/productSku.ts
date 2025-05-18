import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  ProductSkuEntity
} from '../entity/productSku';
import { Rule, RuleType } from '@midwayjs/validate';
/**
 * 商品SKU表
 */
export class ProductSkuQueryDTO extends ProductSkuEntity {

  @Rule(RuleType.number().optional())
  page?: number;
  @Rule(RuleType.number().optional())
  size?: number;
  @Rule(RuleType.string().optional())
  keyWord?: string;
}