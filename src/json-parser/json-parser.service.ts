import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { exec } from 'child_process'; // child_process 모듈 추가

import { JsonNodeProps, ParsedResult } from './json-parser.dto';

@Injectable()
export class JsonParserService {
  constructor(private configService: ConfigService) {}

  // async parseDomToReact(dom: DomProps): Promise<ParsedResult> {}

  async parseJson(jsonList: JsonNodeProps[]): Promise<ParsedResult> {
    try {
      const cssFileResult = await this.jsonListToCss(jsonList);
      if (!cssFileResult) throw new Error('Failed to write CSS file');

      const htmlFileResult = await this.jsonListToHtml(jsonList);
      if (!htmlFileResult.some((result) => result))
        throw new Error('Failed to write HTML file');

      const reactFileResult = await this.jsonListToReact(jsonList);
      if (!reactFileResult) throw new Error('Failed to write React file');

      const gitInitResult = await this.gitInitDesignDist();
      if (
        !gitInitResult.result &&
        gitInitResult.msg.includes('origin') &&
        gitInitResult.code === 3
      ) {
        // already remote url set -> therefore push
        const gitPushResult = await this.gitPushDesignDist();

        if (!gitPushResult.result && gitPushResult.code === 1) {
          // no updated made, cannot push
          return {
            code: 400,
            message: 'No updated made, cannot push',
          };
        }
      }

      return {
        code: 201,
        message: 'success',
      };
    } catch (error) {
      throw error;
    }
  }

  private tagConverter(
    figmaName: string,
    // convertType?: 'html' | 'react',
  ): string {
    // ex) "<typo>-d3" -> this format
    const tagName = figmaName.split('-')[0];

    switch (tagName) {
      case '<typo>':
        return 'p';

      case '<icon>':
        return 'i';

      case '<button>':
        return 'button';

      default:
        return 'div';
    }
  }

  private async jsonListToHtml(jsonList: JsonNodeProps[]): Promise<boolean[]> {
    const htmlArray = jsonList.map((item) => {
      const tagType = item.name.split('-')[0];
      const className = item.name.split('-')[1];
      const tagName = this.tagConverter(item.name);
      return {
        htmlValue: `<${tagName} class="${className}">
                      ${item.value ? item.value : ''}
                    </${tagName}>`,
        dir: tagType.replace(/<([^>]+)>/, '$1'),
        fileName: className,
      };
    });

    const htmlFileResult = await Promise.all(
      htmlArray.map(async (html) => {
        return await this.writeFile(
          html.fileName,
          html.htmlValue,
          'html',
          html.dir,
        );
      }),
    );

    return htmlFileResult;
  }

  private async jsonListToReact(jsonList: JsonNodeProps[]): Promise<boolean> {
    const cssList = jsonList
      .map((item) => `"${item.name.split('-')[1]}"`)
      .join(',');

    const fileName = jsonList[0].name.split('-')[0].replace(/<([^>]+)>/, '$1');

    const finalJSX = `
        import React from "react";

        const ${fileName} = ({children, tag, ...restProps}) => {

        const cssList = [${cssList}];
        const css = restProps.className ? restProps.className : cssList[0];
     
        if (!!tag) {
          return React.createElement(tag, {...restProps,className: css }, children);
        }

        return <p {...restProps,className: css }>{children}</p>;
        };
        export default ${fileName};
      `;

    const fileWriteResult = await this.writeFile(
      fileName,
      finalJSX,
      'jsx',
      'react',
    );

    return fileWriteResult;
  }
  private async jsonListToCss(jsonList: JsonNodeProps[]): Promise<boolean> {
    const cssArray = jsonList
      .map((item) => {
        const classTarget = item.name.split('-')[1];
        const styleText = item.styleText;
        return `.${classTarget} {
            ${
              styleText
                ? Object.entries(styleText)
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n')
                : ''
            }
          } \n`;
      })
      .join('');

    const fileName = jsonList[0].name.split('-')[0].replace(/<([^>]+)>/, '$1');

    const fileWriteResult = await this.writeFile(fileName, cssArray, 'css');

    return fileWriteResult;
  }

  private async writeFile(
    fileName: string,
    content: string,
    extension: string,
    specificDir?: string,
  ): Promise<boolean> {
    const dirPath = path.join(
      __dirname,
      `../../../hk-home-ui/${specificDir ? `${extension}/${specificDir}` : extension}`,
    );

    const filePath = path.join(dirPath, `${fileName}.${extension}`);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  private async gitInitDesignDist(): Promise<{
    result: boolean;
    msg: string;
    code: number;
  }> {
    const dirPath = path.join(__dirname, '../../../hk-home-ui');
    const remoteUrl = this.configService.get('GIT_REMOTE_URL');

    try {
      await this.runGitCommand(
        [`git init`, `git remote add origin ${remoteUrl}`],
        dirPath,
      );

      return {
        result: true,
        msg: 'Initialized repository successfully',
        code: 201,
      };
    } catch (error) {
      console.error('Error initializing repository:', error.message);
      return { result: false, msg: error.message, code: error.code || 500 };
    }
  }

  private async gitPushDesignDist() {
    const dirPath = path.join(__dirname, '../../../hk-home-ui');
    const remoteUrl = this.configService.get('GIT_REMOTE_URL');

    try {
      await this.runGitCommand(
        [
          `git remote set-url origin ${remoteUrl}`,
          `git add .`,
          `git commit -m "Add generated CSS file ${new Date().toLocaleString()}"`,
          `git push -u origin master`,
        ],
        dirPath,
      );

      return {
        result: true,
        msg: 'Pushed changes to remote successfully',
        code: 201,
      };
    } catch (error) {
      console.error('Error pushing changes to remote:', error);
      return { result: false, msg: error.message, code: error.code || 500 };
    }
  }

  private runGitCommand(commands: string[], dirPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(commands.join(' && '), { cwd: dirPath }, (err, stdout, stderr) => {
        if (err) {
          console.error(`Git command failed: ${stderr}`);
          return reject(err);
        }
        console.log(`Git command output: ${stdout}`);
        resolve(stdout);
      });
    });
  }
}
