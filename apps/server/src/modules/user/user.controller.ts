import { Body, Controller, Get, Put, UsePipes } from '@nestjs/common';
import {
  type Ledger,
  type User,
  type UserPreferencesUpdate,
  UserPreferencesUpdateSchema,
  type UserProfile,
} from '@stock/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMyProfile(): { user: User; profile: UserProfile; ledgers: Ledger[] } {
    return this.userService.getMyProfile();
  }

  @Put('me/preferences')
  @UsePipes(new ZodValidationPipe(UserPreferencesUpdateSchema))
  updatePreferences(@Body() data: UserPreferencesUpdate): UserProfile {
    return this.userService.updatePreferences(data);
  }
}
