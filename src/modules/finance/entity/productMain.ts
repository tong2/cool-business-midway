import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Rule, RuleType } from '@midwayjs/validate';


/**
 * 商品主表
 */
@Entity('product_main')
export class ProductMainEntity extends BaseEntity {

  @PrimaryColumn({ comment: '宝贝ID', length: 150 })
  @Rule(RuleType.string().optional())
  product_id: string;

  @Column({ comment: '标题', nullable: true, length: 200 })
  @Rule(RuleType.string().optional())
  title: string;

  @Column({ comment: '宝贝链接' ,nullable: true, length: 500 })
  @Rule(RuleType.string().optional())
  product_link: string;

  @Column({ comment: '图片地址' ,nullable: true, length: 500 })
  @Rule(RuleType.string().optional())
  image_url: string;

  @Column({
    comment: '价格',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  @Rule(RuleType.number().optional())
  price: number;

  @Column({ comment: '销量', nullable: true, type: 'int' })
  @Rule(RuleType.number().optional())
  sales_volume: number;

  @Column({ comment: '店铺名', nullable: true, length: 100 })
  @Rule(RuleType.string().optional())
  shop_name: string;

  @Column({ comment: '店铺链接' ,nullable: true, length: 5000 })
  @Rule(RuleType.string().optional())
  shop_link: string;

  @Column({ comment: '类目ID', nullable: true, length: 150 })
  @Rule(RuleType.string().optional())
  category_id: string;

  @Column({ comment: '类目名', nullable: true, length: 100 })
  @Rule(RuleType.string().optional())
  category_name: string;

}