import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementTemplateService } from '../services/template.service';
import { EventAnnouncementsService } from '../event-announcements.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateFromTemplateDto,
  QueryTemplateDto,
  PreviewTemplateDto,
  CloneTemplateDto,
} from '../dto/template.dto';
import { TemplateCategory } from '../entities/announcement-template.entity';

@Controller('announcement-templates')
export class AnnouncementTemplatesController {
  constructor(
    private readonly templateService: AnnouncementTemplateService,
    private readonly announcementsService: EventAnnouncementsService,
  ) {}

  @Post()
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return await this.templateService.createTemplate(createTemplateDto);
  }

  @Get()
  async findAllTemplates(@Query() queryDto: QueryTemplateDto) {
    return await this.templateService.findAllTemplates(queryDto);
  }

  @Get('categories')
  getTemplateCategories() {
    return this.templateService.getTemplateCategories();
  }

  @Get('popular')
  async getPopularTemplates(@Query('limit') limit: number = 10) {
    return await this.templateService.getPopularTemplates(limit);
  }

  @Get('stats')
  async getTemplateStats() {
    const templates = await this.templateService.findAllTemplates();
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter((t) => t.isActive).length;
    const systemTemplates = templates.filter((t) => t.isSystem).length;

    const mostUsedTemplate = templates.reduce((prev, current) =>
      prev.usageCount > current.usageCount ? prev : current,
    );

    const categoriesCount = templates.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      },
      {} as Record<TemplateCategory, number>,
    );

    const typesCount = templates.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      totalTemplates,
      activeTemplates,
      systemTemplates,
      mostUsedTemplate: {
        id: mostUsedTemplate.id,
        name: mostUsedTemplate.name,
        usageCount: mostUsedTemplate.usageCount,
      },
      categoriesCount,
      typesCount,
    };
  }

  @Post('preview')
  async previewTemplate(@Body() previewDto: PreviewTemplateDto) {
    return await this.templateService.previewTemplate(
      previewDto.templateId,
      previewDto.variables,
    );
  }

  @Post('generate')
  async generateFromTemplate(@Body() generateDto: GenerateFromTemplateDto) {
    const announcementDto =
      await this.templateService.generateFromTemplate(generateDto);
    return await this.announcementsService.create(announcementDto);
  }

  @Post(':id/clone')
  async cloneTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cloneDto: CloneTemplateDto,
  ) {
    return await this.templateService.cloneTemplate(
      id,
      cloneDto.newName,
      cloneDto.createdBy,
    );
  }

  @Get(':id')
  async findTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.templateService.findTemplateById(id);
  }

  @Patch(':id')
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return await this.templateService.updateTemplate(id, updateTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.templateService.deleteTemplate(id);
  }

  @Post('initialize-system')
  @HttpCode(HttpStatus.NO_CONTENT)
  async initializeSystemTemplates() {
    return await this.templateService.initializeSystemTemplates();
  }
}
