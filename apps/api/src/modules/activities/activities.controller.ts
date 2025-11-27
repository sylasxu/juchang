import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ActivityService } from '@juchang/services';
import { CurrentUser } from '../../decorators/current-user';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  createActivitySchema,
  type CreateActivityDto,
} from './dto/create-activity.dto';
import {
  joinActivitySchema,
  type JoinActivityDto,
} from './dto/join-activity.dto';
import {
  reviewApplicationSchema,
  type ReviewApplicationDto,
} from './dto/review-application.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * 创建活动
   * POST /activities
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createActivitySchema))
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    const activity = await this.activityService.create({
      creatorId: userId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      startAt: new Date(dto.startAt),
      location: {
        lat: dto.location.lat,
        lng: dto.location.lng,
        name: dto.location.name,
        address: dto.location.address,
      },
      maxParticipants: dto.maxParticipants,
      feeType: dto.feeType,
      estimatedCost: dto.estimatedCost,
      joinMode: dto.joinMode,
      riskScore: dto.riskScore,
    });

    return activity;
  }

  /**
   * 查找附近活动
   * GET /activities/nearby?lat=39.9&lng=116.4&radiusKm=5&type=sports
   */
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('type') type?: string,
  ) {
    const activities = await this.activityService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radiusKm ? parseFloat(radiusKm) : 5,
      type,
    );

    return activities;
  }

  /**
   * 获取活动详情
   * GET /activities/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    // TODO: 实现获取活动详情的逻辑
    // 需要添加 ActivityService.getById 方法
    throw new Error('Not implemented');
  }

  /**
   * 申请加入活动
   * POST /activities/:id/join
   */
  @Post(':id/join')
  @UsePipes(new ZodValidationPipe(joinActivitySchema))
  async join(
    @Param('id') activityId: string,
    @Body() dto: JoinActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    const participant = await this.activityService.join(
      activityId,
      userId,
      dto.applicationMsg,
    );

    return participant;
  }

  /**
   * 创建者审核申请
   * PATCH /activities/:id/applications/:participantId
   */
  @Patch(':id/applications/:participantId')
  @UsePipes(new ZodValidationPipe(reviewApplicationSchema))
  async reviewApplication(
    @Param('id') activityId: string,
    @Param('participantId') participantId: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser('id') userId: string,
  ) {
    const participant = await this.activityService.reviewApplication(
      activityId,
      participantId,
      userId,
      dto.action,
    );

    return participant;
  }
}

