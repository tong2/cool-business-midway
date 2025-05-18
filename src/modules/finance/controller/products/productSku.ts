import { CoolController, BaseController } from '@cool-midway/core';
import { ProductSkuEntity } from '../../entity/productSku';
import { ProductSkuService } from '../../service/productSku';
import { ProductSkuQueryDTO } from '../../dto/productSku';
import { Body, Inject, Post, Get, Provide, Files, File, Query } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from 'vm';
import { Validate } from '@midwayjs/validate';
import * as ExcelJS from 'exceljs';
import { existsSync, readFileSync } from 'fs';

/**
 * 商品SKU表控制器
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ProductSkuEntity,
  service: ProductSkuService,
})
export class ProductSkuController extends BaseController {
  @InjectEntityModel(ProductSkuEntity)
  productSkuEntity: Repository<ProductSkuEntity>;

  @Inject()
  ctx: Context;

  @Inject()
  productSkuService: ProductSkuService;

  /**
   * 导出商品SKU表记录到 Excel
   */
  @Get('/export')
  @Validate()
  async export(@Query() query: ProductSkuQueryDTO) {
    const { headers, data } = await this.productSkuService.export(query);

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('商品SKU表');

    // 添加表头，使用中文标签
    worksheet.columns = headers.map(header => ({
      header: header.label,
      key: header.key,
      width: 20,
    }));

    // 添加数据
    worksheet.addRows(data);

    // 设置响应头
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    this.ctx.set('Content-Disposition', 'attachment; filename=product-sku.xlsx');

    // 写入缓冲区并返回
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  @Post('/import')
  async importExcel(@File() file) {
    try {

      console.log('Uploaded File:', {
        filename: file.filename,
        mimeType: file.mimeType,
        dataType: typeof file.data,
        dataLength: Buffer.isBuffer(file.data) ? file.data.length : file.data,
      });

      // Validate MIME type for .xlsx
      if (file.mimeType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        console.log('Invalid MIME type:', file.mimeType);
        return this.fail('仅支持 .xlsx 文件');
      }

      // Initialize workbook
      const workbook = new ExcelJS.Workbook();

      // Handle file.data based on type (Buffer or path)
      if (Buffer.isBuffer(file.data)) {
        // mode: 'stream', file.data is a Buffer
        console.log('Reading Excel file from Buffer, size:', file.data.length);
        if (file.data.length === 0) {
          console.log('Buffer is empty');
          return this.fail('上传的文件数据为空');
        }
        try {
          await workbook.xlsx.load(file.data);
        } catch (error) {
          console.error('ExcelJS load error:', error);
          return this.fail('无法解析 Excel 文件：文件可能不是有效的 .xlsx 格式');
        }
      } else if (typeof file.data === 'string') {
        // mode: 'file', file.data is a path
        console.log('Reading Excel file from path:', file.data);
        if (!existsSync(file.data)) {
          console.log('File does not exist at path:', file.data);
          return this.fail('上传的文件不存在');
        }
        // Read file to check ZIP header
        const fileBuffer = readFileSync(file.data);
        const zipHeader = fileBuffer.slice(0, 4).toString('hex');
        console.log('File ZIP header:', zipHeader);
        if (!zipHeader.startsWith('504b')) {
          console.log('File is not a valid ZIP file');
          return this.fail('文件不是有效的 .xlsx 格式');
        }
        try {
          await workbook.xlsx.readFile(file.data);
        } catch (error) {
          console.error('ExcelJS readFile error:', error);
          return this.fail('无法解析 Excel 文件：文件可能不是有效的 .xlsx 格式');
        }
      } else {
        console.log('Invalid file.data type:', typeof file.data);
        return this.fail('文件数据格式错误，期望 Buffer 或文件路径');
      }

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        console.log('No worksheet found in the Excel file');
        return this.fail('Excel 文件没有找到工作表');
      }

      // Parse worksheet data
      console.log('Found worksheet:', worksheet.name);
      const data: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row is headers
          row.eachCell(cell => {
            headers.push(cell.value ? String(cell.value).trim() : '');
          });
          console.log('Headers:', headers);
        } else {
          // Data rows
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value !== null && cell.value !== undefined ? cell.value : '';
            }
          });
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        }
      });

      // Check if valid data exists
      if (data.length === 0) {
        console.log('No valid data found in the Excel file');
        return this.fail('Excel 文件中没有有效数据');
      }

      // Process data for import
      console.log('Processing data for import, rows:', data.length);
      const result = await this.productSkuService.import(data);

      console.log('Import successful:', result);
      return this.ok({
        message: '导入成功',
        data: result,
      });
    } catch (error) {
      console.error('导入失败:', error);
      return this.fail('导入失败: ' + error.message);
    }
  }

  /**
   * 分页查询商品SKU表
   */
  @Post('/page2')
  async page2(@Body() query: ProductSkuQueryDTO) {
    try {
      const result = await this.productSkuService.list(query);
      return this.ok({
        list: result.list,
        pagination: {
          page: query.page,
          size: query.size,
          total: result.total,
        },
        message: '成功',
      });
    } catch (error) {
      return this.fail('查询失败: ' + error.message);
    }
  }

  /**
   * 根据 ID 更新商品 SKU，仅更新有值的字段
   */
  @Post('/updateById')
  @Validate()
  async updateById(@Body() body: Partial<ProductSkuEntity>) {
    try {
      const { id, ...updateFields } = body;

      // 检查 ID 是否提供
      if (!id) {
        return this.fail('ID 不能为空');
      }

      // 检查记录是否存在
      const existingRecord = await this.productSkuEntity.findOne({ where: { id } });
      if (!existingRecord) {
        return this.fail('记录不存在');
      }

      // 定义有效的数据库列名
      const validColumns = [
        'product_id',
        'sku_name',
        'image',
        'original_price',
        'calculated_price',
        'stock',
        'manual_unit_price',
      ];

      // 过滤掉空值和非列字段，仅保留有效字段
      const fieldsToUpdate: { [key: string]: any } = {};
      Object.entries(updateFields).forEach(([key, value]) => {
        // 只处理有效列名且值非空
        if (validColumns.includes(key) && value !== null && value !== undefined) {
          fieldsToUpdate[key] = value;
        }
      });

      // 如果没有需要更新的字段
      if (Object.keys(fieldsToUpdate).length === 0) {
        return this.ok({
          message: '没有提供需要更新的字段',
        });
      }

      // 执行更新
      await this.productSkuEntity.update(id, fieldsToUpdate);

      return this.ok({
        message: '更新成功',
      });
    } catch (error) {
      console.error('更新失败:', error);
      return this.fail('更新失败: ' + error.message);
    }
  }

}