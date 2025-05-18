import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * 商品主表
 */
@Entity('product_main')
export class ProductMainEntity extends BaseEntity {

  @PrimaryColumn({ comment: '宝贝ID', length: 50 })
  product_id: string;

  @Column({ comment: '标题', nullable: true, length: 200 })
  title: string;

  @Column({ comment: '宝贝链接' ,nullable: true, length: 200 })
  product_link: string;

  @Column({ comment: '图片地址' ,nullable: true, length: 200 })
  image_url: string;

  @Column({
    comment: '价格',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  price: number;

  @Column({ comment: '销量', nullable: true, type: 'int' })
  sales_volume: number;

  @Column({ comment: '店铺名', nullable: true, length: 100 })
  shop_name: string;

  @Column({ comment: '店铺链接' ,nullable: true, length: 200 })
  shop_link: string;

  @Column({ comment: '类目ID', nullable: true, length: 50 })
  category_id: string;

  @Column({ comment: '类目名', nullable: true, length: 100 })
  category_name: string;

}