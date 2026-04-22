import { Controller, Get, Put, Body, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserProfile, UserPreferencesUpdate, UserPreferencesUpdateSchema } from '@stock/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

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
