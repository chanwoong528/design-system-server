import { Body, Controller, Post } from '@nestjs/common';
import { JsonParserService } from './json-parser.service';
import { ParsedResult, ReqBodyJsonParser } from './json-parser.dto';

@Controller('json-parser')
export class JsonParserController {
  constructor(private jsonParserService: JsonParserService) {}

  @Post()
  async parseJson(@Body() reqBody: ReqBodyJsonParser): Promise<ParsedResult> {
    // console.log('>>>>>>>>>>>>> ', reqBody);
    // const { dom, style } = reqBody;
    // const result = await this.jsonParserService.parseJson(jsonList);
    // return result;
  }
}
