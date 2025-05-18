import { ProductMainEntity } from '../entity/productMain';
import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

/**
 * 商品主表服务
 */
@Provide()
export class ProductMainService extends BaseService {
  @InjectEntityModel(ProductMainEntity)
  productMainModel: Repository<ProductMainEntity>;

  /**
   * 条件分页查询，使用原生 SQL 查询，从 product_sku 关联 product_main，查询明细数据
   * @param query - 查询条件
   * @param skipPagination - 是否跳过分页（用于导出）
   */
  async list(query: any, skipPagination: boolean = false) {
    const {
      page = 1,
      size = 10,
      product_id,
      title,
      shop_name,
      category_name,
      keyWord,
      ...otherParams
    } = query;

    // 构建 WHERE 条件和参数
    const conditions: string[] = [];
    const parameters: { [key: string]: any } = {};

    // 对 product_main 的字符串字段进行模糊匹配
    if (product_id) {
      conditions.push('main.product_id LIKE ?');
      parameters.product_id = `%${product_id}%`;
    }
    if (keyWord) {
      conditions.push('main.product_id LIKE ?');
      parameters.keyWord = `%${keyWord}%`;
    }
    if (title) {
      conditions.push('main.title LIKE ?');
      parameters.title = `%${title}%`;
    }
    if (shop_name) {
      conditions.push('main.shop_name LIKE ?');
      parameters.shop_name = `%${shop_name}%`;
    }
    if (category_name) {
      conditions.push('main.category_name LIKE ?');
      parameters.category_name = `%${category_name}%`;
    }

    // 对其他 product_main 字段进行精确匹配
    Object.keys(otherParams).forEach(key => {
      if (otherParams[key] && ProductMainEntity.prototype.hasOwnProperty(key)) {
        conditions.push(`main.${key} = ?`);
        parameters[key] = otherParams[key];
      }
    });

    // 构造 WHERE 子句
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 参数值按顺序排列
    const paramValues = Object.values(parameters);

    // 主查询，从 product_sku 开始，关联 product_main，查询明细
    let mainQuery = `
      SELECT 
        main.title,
        main.product_link,
        main.image_url,
        main.price,
        main.sales_volume,
        main.shop_name,
        main.shop_link,
        main.category_id,
        main.category_name,
        sku.id AS sku_id,
        sku.product_id AS product_id,
        sku.sku_name,
        sku.image AS sku_image,
        sku.original_price,
        sku.calculated_price,
        sku.stock,
        sku.manual_unit_price
      FROM product_sku sku
      left JOIN product_main main ON main.product_id = sku.product_id
      ${whereClause}
    `;

    // 添加分页（除非跳过）
    const limitOffsetParams = skipPagination ? paramValues : [...paramValues, size, (page - 1) * size];
    if (!skipPagination) {
      mainQuery += ` LIMIT ? OFFSET ?`;
    }

    // 执行主查询
    const list = await this.productMainModel.query(mainQuery, limitOffsetParams);

    // 计数查询，统计 product_sku 记录数
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM product_sku sku
      INNER JOIN product_main main ON main.product_id = sku.product_id
      ${whereClause}
    `;

    // 执行计数查询
    const [countResult] = await this.productMainModel.query(countQuery, paramValues);
    const total = parseInt(countResult.total, 10);

    return { list, total };
  }

  /**
   * 导出数据，复用 list 方法查询明细数据
   * @param query - 查询条件
   */
  async export(query: any) {
    // 调用 list 方法，跳过分页
    const { list: data } = await this.list(query, true);

    // 定义导出表头，使用中文标签
    const headers = [
      { key: 'product_id', label: '宝贝ID' },
      { key: 'title', label: '标题' },
      { key: 'product_link', label: '宝贝链接' },
      { key: 'image_url', label: '图片地址' },
      { key: 'price', label: '价格' },
      { key: 'sales_volume', label: '销量' },
      { key: 'shop_name', label: '店铺名' },
      { key: 'shop_link', label: '店铺链接' },
      { key: 'category_id', label: '类目ID' },
      { key: 'category_name', label: '类目名' },
      { key: 'sku_id', label: 'SKU ID' },
      { key: 'sku_name', label: 'SKU名称' },
      { key: 'sku_image', label: 'SKU图片' },
      { key: 'original_price', label: '原价' },
      { key: 'calculated_price', label: '计算价格' },
      { key: 'stock', label: '库存' },
      { key: 'manual_unit_price', label: '人工单价' },
    ];

    // 格式化导出数据
    const exportData = data.map((item: any) => {
      const row: { [key: string]: any } = {};
      headers.forEach(header => {
        row[header.key] = item[header.key] ?? '';
        // 处理数值字段
        if (header.key === 'price' || header.key === 'original_price' || header.key === 'calculated_price' || header.key === 'manual_unit_price') {
          row[header.key] = row[header.key] ? parseFloat(row[header.key]) : '';
        } else if (header.key === 'sales_volume' || header.key === 'stock' || header.key === 'sku_id') {
          row[header.key] = row[header.key] ? parseInt(row[header.key], 10) : '';
        }
      });
      return row;
    });

    return { headers, data: exportData };
  }

  /**
   * 从 Excel 数据导入商品主表记录，调用 list 方法检查重复，更新或新增记录
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

    const entities: ProductMainEntity[] = [];
    const productIds = data
      .map(item => safeTrim(item['宝贝ID']))
      .filter(id => id); // 收集有效 product_id

    // 批量查询现有 product_id 对应的 id
    let existingRecords: { id: number; product_id: string }[] = [];
    if (productIds.length > 0) {
      const query = `
        SELECT id, product_id
        FROM product_main
        WHERE product_id IN (?)
      `;
      existingRecords = await this.productMainModel.query(query, [productIds]);
    }

    // 构建现有记录的映射
    const existingMap = new Map<string, number>(
      existingRecords.map(record => [record.product_id, record.id])
    );

    for (const item of data) {
      const productId = safeTrim(item['宝贝ID']);
      if (!productId) continue; // 跳过无效 product_id

      const entity = new ProductMainEntity();
      entity.product_id = productId;
      entity.title = safeTrim(item['标题']) ?? null;
      entity.product_link = safeTrim(item['宝贝链接']) ?? null;
      entity.image_url = safeTrim(item['图片地址']) ?? null;
      entity.shop_name = safeTrim(item['店铺名']) ?? null;
      entity.shop_link = safeTrim(item['店铺链接']) ?? null;
      entity.category_id = safeTrim(item['类目ID']) ?? null;
      entity.category_name = safeTrim(item['类目名']) ?? null;
      entity.price = parseFloat(item['价格']) || null;
      entity.sales_volume = parseInt(item['销量'], 10) || null;

      // 如果记录存在，设置为更新
      if (existingMap.has(productId)) {
        entity.id = existingMap.get(productId)!; // 设置现有记录的 id
      }

      entities.push(entity);
    }

    // 批量保存（插入新记录，更新现有记录）
    if (entities.length > 0) {
      await this.productMainModel.save(entities, { chunk: 1000 });
    }

    return { success: true, count: entities.length };
  }
}