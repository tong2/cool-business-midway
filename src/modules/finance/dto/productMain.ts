import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  ProductMainEntity
} from '../entity/productMain';
import { Rule, RuleType } from '@midwayjs/validate';
/**
 * 商品主表
 */
export class ProductMainQueryDTO extends ProductMainEntity {

  @Rule(RuleType.number().optional())
  page?: number;

  @Rule(RuleType.number().optional())
  size?: number;
  @Rule(RuleType.string().optional())
  keyWord?: string;
}