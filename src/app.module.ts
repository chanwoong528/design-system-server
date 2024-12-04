import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JsonParserController } from './json-parser/json-parser.controller';
import { JsonParserService } from './json-parser/json-parser.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [AppController, JsonParserController],
  providers: [AppService, JsonParserService, ConfigService],
})
export class AppModule {}
