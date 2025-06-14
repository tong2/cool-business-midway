import { CoolController, BaseController } from '@cool-midway/core';
import { ProductMainEntity } from '../../entity/productMain';
import { ProductMainService } from '../../service/productMain';
import { ProductMainQueryDTO } from '../../dto/productMain';
import { Body, Inject, Post, Get, Provide, Files, File, Query } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from 'vm';
import { Validate } from '@midwayjs/validate';
import * as ExcelJS from 'exceljs';
import { existsSync, readFileSync } from 'fs';

/**
 * 商品主表控制器
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ProductMainEntity,
  service: ProductMainService,
})
export class ProductMainController extends BaseController {
  @InjectEntityModel(ProductMainEntity)
  productMainEntity: Repository<ProductMainEntity>;

  @Inject()
  ctx: Context;

  @Inject()
  productMainService: ProductMainService;

  /**
   * 导出商品主表记录到 Excel
   */
  @Get('/export')
  @Validate()
  async export(@Query() query: ProductMainQueryDTO) {
    const { headers, data } = await this.productMainService.export(query);

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('商品主表');

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
    this.ctx.set('Content-Disposition', 'attachment; filename=product-main.xlsx');

    // 写入缓冲区并返回
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
    * 从 Excel 导入商品主表记录
    */
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
        // Check if buffer starts with ZIP header (PK)
        //  const zipHeader = file.data.slice(0, 4).toString('hex');
        //  console.log('Buffer ZIP header:', zipHeader);
        //  if (!zipHeader.startsWith('504b')) {
        //    console.log('Buffer is not a valid ZIP file');
        //    return this.fail('文件不是有效的 .xlsx 格式');
        //  }
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
      const result = await this.productMainService.import(data);

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
   * 分页查询商品主表
   */
  @Post('/page2')
  async page2(@Body() query: ProductMainQueryDTO) {
    try {
      const result = await this.productMainService.list(query);
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
}