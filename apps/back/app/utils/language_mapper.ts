import langData from '@hypertube/shared/src/lang.json' with { type: 'json' }

export interface LanguageInfo {
  iso: string
  iso_639_1: string
  name: string
  nativeName: string
  flag: string
}

export class LanguageMapper {
  private static languageMap: Map<string, LanguageInfo> = new Map()

  static {
    Object.entries(langData).forEach(([key, value]) => {
      this.languageMap.set(key, value as LanguageInfo)
    })
  }

  static getLanguageInfo(languageCode: string): LanguageInfo | undefined {
    return this.languageMap.get(languageCode)
  }

  static getLanguageCodesToTry(languageCode: string): string[] {
    const langInfo = this.getLanguageInfo(languageCode)
    
    if (!langInfo) {
      return [languageCode]
    }

    const codesToTry: string[] = []
    
    if (langInfo.iso_639_1 && langInfo.iso_639_1 !== langInfo.iso) {
      codesToTry.push(langInfo.iso_639_1)
    }
    
    codesToTry.push(langInfo.iso)
    
    return [...new Set(codesToTry)]
  }

  static getPrimaryLanguageCode(languageCode: string): string {
    const langInfo = this.getLanguageInfo(languageCode)
    
    if (!langInfo) {
      return languageCode
    }

    return langInfo.iso_639_1 || langInfo.iso
  }

  static getSupportedLanguages(): string[] {
    return Array.from(this.languageMap.keys())
  }

  static isLanguageSupported(languageCode: string): boolean {
    return this.languageMap.has(languageCode)
  }
}
