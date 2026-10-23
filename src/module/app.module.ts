import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/db.module';
import { UsersModule } from './user/user.module';
import { AuthModule } from '../auth/auth.module';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    GmailModule,
  ],
})
export class AppModule {}
