import { ProductSkuEntity } from '../entity/productSku';
import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';

/**
 * 商品SKU表服务
 */
@Provide()
export class ProductSkuService extends BaseService {
  @InjectEntityModel(ProductSkuEntity)
  productSkuModel: Repository<ProductSkuEntity>;

  /**
   * 条件分页查询，支持模糊匹配
   * @param query - 查询条件
   */
  async list(query: any) {
    const {
      page = 1,
      size = 10,
      product_id,
      sku_name,
      keyWord,
      ...otherParams
    } = query;

    const where: FindOptionsWhere<ProductSkuEntity> = {};

    // 模糊匹配字符串字段
    if (product_id) {
      where.product_id = Like(`%${product_id}%`);
    }
    if (keyWord) {
      where.product_id = Like(`%${keyWord}%`);
    }
    if (sku_name) {
      where.sku_name = Like(`%${sku_name}%`);
    }

    // 其他动态条件（精确匹配）
    Object.keys(otherParams).forEach(key => {
      if (otherParams[key] && ProductSkuEntity.prototype.hasOwnProperty(key)) {
        where[key] = otherParams[key];
      }
    });

    const [list, total] = await this.productSkuModel.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
    });

    return { list, total };
  }

  /**
   * 导出数据，支持条件查询
   * @param query - 查询条件
   */
  async export(query: any) {
    const where: FindOptionsWhere<ProductSkuEntity> = {};

    // 应用与 list 方法相同的条件
    const { product_id, sku_name, ...otherParams } = query;

    if (product_id) {
      where.product_id = Like(`%${product_id}%`);
    }
    if (sku_name) {
      where.sku_name = Like(`%${sku_name}%`);
    }

    Object.keys(otherParams).forEach(key => {
      if (otherParams[key] && ProductSkuEntity.prototype.hasOwnProperty(key)) {
        where[key] = otherParams[key];
      }
    });

    const data = await this.productSkuModel.find({ where });

    // 定义导出表头，使用中文标签
    const headers = [
      { key: 'product_id', label: '宝贝ID' },
      { key: 'sku_name', label: 'SKU名称' },
      { key: 'image', label: '图片' },
      { key: 'original_price', label: '原价' },
      { key: 'calculated_price', label: '计算价格' },
      { key: 'stock', label: '库存' },
      { key: 'manual_unit_price', label: '人工单价' },
    ];

    // 格式化导出数据
    const exportData = data.map(item => {
      const row: { [key: string]: any } = {};
      headers.forEach(header => {
        row[header.key] = item[header.key] ?? '';
      });
      return row;
    });

    return { headers, data: exportData };
  }

  /**
   * 从 Excel 数据导入商品SKU表记录
   * @param data - 解析的 Excel 数据
   */
  async import(data: any[]) {
    const safeTrim = (value: any) => {
      if (value === '-') {
        return null; // 处理 "-" 为 null
      }
      if (typeof value === 'string') {
        // 移除问题字符
        return value.trim().replace(/[\0\b\n\r\t\\'"\x1a]/g, '');
      }
      return value;
    };

    const entities = data.map(item => {
      const entity = new ProductSkuEntity();

      // 字符串字段
      entity.product_id = safeTrim(item['宝贝ID']) ?? null;
      entity.sku_name = safeTrim(item['SKU名称']) ?? null;
      entity.image = safeTrim(item['图片']) ?? null;

      // 数值字段
      entity.original_price = parseFloat(item['原价']) || null;
      entity.calculated_price = parseFloat(item['计算价格']) || null;
      entity.stock = parseInt(item['库存'], 10) || null;
      entity.manual_unit_price = parseFloat(item['人工单价']) || null;

      return entity;
    });

    // 批量保存
    await this.productSkuModel.save(entities);
    return { success: true, count: entities.length };
  }
}