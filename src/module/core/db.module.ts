import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        uri: config.get<string>('DATABASE_URL'),
        autoLoadModels: true,
        synchronize: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        retryAttempts: 5,
        retryDelay: 3000,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
