import { Rule, RuleType } from '@midwayjs/validate';
import { ProductMainEntity } from '../entity/productMain';

/**
 * 商品主表查询 DTO
 */
export class ProductMainQueryDTO {
  [key: string]: any; // Allow any field from ProductMainEntity

  @Rule(RuleType.number().optional())
  page?: number;

  @Rule(RuleType.number().optional())
  size?: number;

  @Rule(RuleType.string().optional())
  keyWord?: string;

  // Explicitly make known ProductMainEntity fields optional and allow empty strings
  @Rule(RuleType.string().optional().allow(''))
  product_id?: string;

  @Rule(RuleType.string().optional().allow(''))
  title?: string;

  @Rule(RuleType.string().optional().allow(''))
  shop_name?: string;

  @Rule(RuleType.string().optional().allow(''))
  category_name?: string;

  @Rule(RuleType.string().optional().allow(''))
  product_link?: string;

  @Rule(RuleType.string().optional().allow(''))
  image_url?: string;

  @Rule(RuleType.number().optional())
  price?: number;

  @Rule(RuleType.number().optional())
  sales_volume?: number;

  @Rule(RuleType.string().optional().allow(''))
  shop_link?: string;

  @Rule(RuleType.string().optional().allow(''))
  category_id?: string;
}