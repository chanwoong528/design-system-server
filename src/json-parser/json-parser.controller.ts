import { Body, Controller, Post } from '@nestjs/common';
import { JsonParserService } from './json-parser.service';
import { ParsedResult, ReqBodyJsonParser } from './json-parser.dto';

@Controller('json-parser')
export class JsonParserController {
  constructor(private jsonParserService: JsonParserService) {}

  @Post()
  async parseJson(@Body() reqBody: ReqBodyJsonParser): Promise<ParsedResult> {
    const { jsonList } = reqBody;

    const result = await this.jsonParserService.parseJson(jsonList);

    console.log("!!!")
    return result;
  }
}
