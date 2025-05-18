import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 商品SKU表
 */
@Entity('product_sku')
export class ProductSkuEntity extends BaseEntity {

  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ comment: '宝贝ID', length: 150 })
  product_id: string;

  @Column({ comment: 'sku名称', nullable: true, length: 100 })
  sku_name: string;

  @Column({ comment: '图片', nullable: true, length: 500 })
  image: string;

  @Column({
    comment: '原价',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  original_price: number;

  @Column({
    comment: '计算价格',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  calculated_price: number;

  @Column({ comment: '库存', nullable: true, type: 'int' })
  stock: number;

  @Column({
    comment: '人工单价',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2
  })
  manual_unit_price: number;

}