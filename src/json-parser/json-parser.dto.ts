// EndType =["textNode”, “imageNode”]

// {
//  markupType : “button”, “p”, “span” , “a” , etc…
//  type: “default”, “i-icon”, “r-icon”, “h-icon”, etc…
//  children: [
//     “imageNode”, “textNode”, “imageNode”
//   ]
// }
export class JsonNodeProps {
  name: string;

  type: string;

  styleText?: Record<string, any>;
  children?: JsonNodeProps[];
}

export class ReqBodyJsonParser {
  jsonList: JsonNodeProps[];
}

export class ParsedResult {
  code: number;
  message: string;
}
