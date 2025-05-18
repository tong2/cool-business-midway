import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
// 为 ProductSkuEntity 添加校验装饰器
// 由于直接使用实体类，需要在实体类中添加校验
import { IsOptional, IsNumber } from 'class-validator';

/**
 * 商品SKU表
 */
@Entity('product_sku')
export class ProductSkuEntity extends BaseEntity {

  @PrimaryGeneratedColumn({ comment: '主键ID' })
  @IsNotEmpty({ message: 'ID 不能为空' })
  id: number;

  @Column({ comment: '宝贝ID', length: 150 })
  @IsOptional()
  product_id: string;

  @Column({ comment: 'sku名称', nullable: true, length: 100 })
  @IsOptional()
  sku_name: string;

  @Column({ comment: '图片', nullable: true, length: 500 })
  @IsOptional()
  image: string;

  @Column({
    comment: '原价',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: '原价必须是数字' })
  original_price: number;

  @Column({
    comment: '计算价格',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: '计算价格必须是数字' })
  calculated_price: number;

  @Column({ comment: '库存', nullable: true, type: 'int' })
  @IsOptional()
  @IsNumber({}, { message: '库存必须是数字' })
  stock: number;

  @Column({
    comment: '人工单价',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: '人工单价必须是数字' })
  manual_unit_price: number;

}