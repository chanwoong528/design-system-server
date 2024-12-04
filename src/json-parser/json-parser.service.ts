import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { exec } from 'child_process'; // child_process 모듈 추가

import { JsonNodeProps, ParsedResult } from './json-parser.dto';

@Injectable()
export class JsonParserService {
  constructor(private configService: ConfigService) {}

  async parseJson(jsonList: JsonNodeProps[]): Promise<ParsedResult> {
    try {
      const cssFileResult = await this.jsonListToCss(jsonList);
      if (!cssFileResult) throw new Error('Failed to write CSS file');

      // await this.pushToGit(); // after every convertion have been finished then push it to git.

      return {
        code: 201,
        message: 'success',
      };
    } catch (error) {
      throw error;
    }
  }




  private tagConverter(figmaName: string): string {
    // "<typo>-d3" -> this format
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

  private jsonToHtml(json: JsonNodeProps): string {
    return '11';
  }
  private jsonToReact(json: JsonNodeProps): string {
    return '11';
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
  ): Promise<boolean> {
    const dirPath = path.join(__dirname, `../design/${extension}`);

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

  private pushToGit() {
    const distPath = path.join(__dirname, '../../dist/design');

    return new Promise((resolve, reject) => {
      const remoteUrl = this.configService.get('GIT_REMOTE_URL'); // 원격 저장소 URL 가져오기

      exec(
        `git remote -v`, // 현재 원격 저장소 확인
        { cwd: path.dirname(distPath) },
        (err, stdout) => {
          if (stdout.includes('origin')) {
            console.log('Remote origin already exists, skipping init.');
            // 원격 저장소가 이미 존재하는 경우, init을 건너뜁니다.
            this.addAndPush(distPath, remoteUrl, resolve, reject);
          } else {
            exec(
              `git init`, // 새로운 Git 저장소 초기화
              { cwd: path.dirname(distPath) },
              (err) => {
                if (err) {
                  return reject(err);
                }
                this.addAndPush(distPath, remoteUrl, resolve, reject);
              },
            );
          }
        },
      );
    });
  }

  private addAndPush(
    distPath: string,
    remoteUrl: string,
    resolve: Function,
    reject: Function,
  ) {
    exec(
      `git remote -v`, // 현재 원격 저장소 확인
      { cwd: path.dirname(distPath) },
      (err, stdout) => {
        if (stdout.includes('origin')) {
          console.log('Remote origin already exists, skipping add.');
          // 원격 저장소가 이미 존재하는 경우, add를 건너뜁니다.
          this.commitAndPush(distPath, resolve, reject);
        } else {
          exec(
            `git remote add origin ${remoteUrl}`,
            { cwd: path.dirname(distPath) },
            (err) => {
              if (err) {
                return reject(err);
              }
              this.commitAndPush(distPath, resolve, reject);
            },
          );
        }
      },
    );
  }

  private commitAndPush(distPath: string, resolve: Function, reject: Function) {
    exec(`git add .`, { cwd: path.dirname(distPath) }, (err) => {
      if (err) {
        return reject(err);
      }
      exec(
        'git commit -m "Add generated CSS file"',
        { cwd: path.dirname(distPath) },
        (err) => {
          if (err) {
            return reject(err);
          }
          exec(
            'git push -u origin master',
            { cwd: path.dirname(distPath) },
            (err) => {
              if (err) {
                return reject(err);
              }
              resolve(true);
            },
          );
        },
      );
    });
  }
}
