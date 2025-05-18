import { CoolController, BaseController } from '@cool-midway/core';
import { ProductMainEntity } from '../../entity/productMain';
import { ProductMainService } from '../../service/productMain';
import { ProductMainQueryDTO } from '../../dto/productMain';
import { Body, Inject, Post, Get, Provide, Files, Query } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from 'vm';
import { Validate } from '@midwayjs/validate';
import * as ExcelJS from 'exceljs';
import { existsSync } from 'fs';

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
  async importExcel(@Files() files) {
    try {
      // 检查文件是否存在
      if (!files || files.length === 0) {
        return this.fail('未上传文件');
      }

      // 获取第一个文件
      const file = files[0];

      // 检查文件数据是否存在
      if (!file?.data) {
        return this.fail('上传的文件路径不存在');
      }

      // 检查文件路径是否有效
      if (!existsSync(file.data)) {
        return this.fail('上传的文件不存在');
      }

      // 读取 Excel 文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.data);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        return this.fail('Excel 文件没有找到工作表');
      }

      // 解析工作表数据
      const data: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // 第一行是表头
          row.eachCell(cell => {
            headers.push(cell.value ? String(cell.value).trim() : '');
          });
        } else {
          // 数据行
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

      // 检查是否有有效数据
      if (data.length === 0) {
        return this.fail('Excel 文件中没有有效数据');
      }

      // 处理导入数据
      const result = await this.productMainService.import(data);

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