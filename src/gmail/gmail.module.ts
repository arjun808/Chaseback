import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { CryptoService } from '../common/crypto.service';
import { UsersModule } from '../module/user/user.module';
import { GmailAccount } from './gmail-account.model';
import { GmailAuthService } from './gmail-auth.service';
import { GmailController } from './gmail.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SequelizeModule.forFeature([GmailAccount]),
  ],
  controllers: [GmailController],
  providers: [GmailAuthService, CryptoService],
  exports: [GmailAuthService],
})
export class GmailModule {}
