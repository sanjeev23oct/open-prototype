import { diff_match_patch } from 'diff-match-patch';
import { CodeSection } from '../types/database';
import { PatchResult, ElementPatch } from '../types/generation';

export class DiffPatchService {
  private dmp: diff_match_patch;

  constructor() {
    this.dmp = new diff_match_patch();
    // Configure for better performance on code
    this.dmp.Diff_Timeout = 1.0;
    this.dmp.Diff_EditCost = 4;
  }

  applyElementPatch(
    elementId: string,
    oldContent: string,
    newContent: string,
    fullHTML: string
  ): PatchResult {
    try {
      // Create patches for the specific element
      const patches = this.dmp.patch_make(oldContent, newContent);
      const patchText = this.dmp.patch_toText(patches);
      
      // Apply patch to the full HTML context
      const updatedHTML = this.applyPatchToHTML(fullHTML, elementId, patches);
      
      return {
        success: true,
        updatedContent: updatedHTML,
        patches: patchText,
        affectedLines: this.getAffectedLines(fullHTML, elementId),
        elementId
      };
    } catch (error) {
      return {
        success: false,
        error: `Patch application failed: ${error.message}`,
        elementId
      };
    }
  }

  applySectionPatch(
    sectionName: string,
    oldSection: CodeSection,
    newContent: string
  ): PatchResult {
    try {
      const patches = this.dmp.patch_make(oldSection.codeContent, newContent);
      const [updatedContent, results] = this.dmp.patch_apply(patches, oldSection.codeContent);
      
      // Check if all patches applied successfully
      const allSuccessful = results.every(result => result === true);
      
      if (!allSuccessful) {
        throw new Error('Some patches failed to apply');
      }

      return {
        success: true,
        updatedContent,
        patches: this.dmp.patch_toText(patches),
        affectedLines: this.calculateAffectedLines(patches),
        sectionName
      };
    } catch (error) {
      return {
        success: false,
        error: `Section patch failed: ${error.message}`,
        sectionName
      };
    }
  }

  createElementPatch(
    elementSelector: string,
    oldContent: string,
    newContent: string
  ): ElementPatch {
    const patches = this.dmp.patch_make(oldContent, newContent);
    
    return {
      elementSelector,
      patchData: this.dmp.patch_toText(patches),
      oldContent,
      newContent,
      timestamp: new Date()
    };
  }

  applyMultiplePatches(
    baseContent: string,
    patches: ElementPatch[]
  ): { success: boolean; content: string; errors: string[] } {
    let currentContent = baseContent;
    const errors: string[] = [];
    
    for (const patch of patches) {
      try {
        const patchObjects = this.dmp.patch_fromText(patch.patchData);
        const [patchedContent, results] = this.dmp.patch_apply(patchObjects, currentContent);
        
        const allSuccessful = results.every(result => result === true);
        if (allSuccessful) {
          currentContent = patchedContent;
        } else {
          errors.push(`Failed to apply patch for ${patch.elementSelector}`);
        }
      } catch (error) {
        errors.push(`Error applying patch for ${patch.elementSelector}: ${error.message}`);
      }
    }
    
    return {
      success: errors.length === 0,
      content: currentContent,
      errors
    };
  }

  private applyPatchToHTML(
    fullHTML: string,
    elementId: string,
    patches: any[]
  ): string {
    const lines = fullHTML.split('\n');
    const elementLocation = this.findElementInHTML(lines, elementId);
    
    if (!elementLocation) {
      throw new Error(`Element ${elementId} not found in HTML`);
    }
    
    // Extract the element content
    const elementLines = lines.slice(elementLocation.startLine, elementLocation.endLine + 1);
    const elementContent = elementLines.join('\n');
    
    // Apply patches to element content
    const [patchedContent] = this.dmp.patch_apply(patches, elementContent);
    
    // Replace the element in the full HTML
    const updatedLines = [
      ...lines.slice(0, elementLocation.startLine),
      ...patchedContent.split('\n'),
      ...lines.slice(elementLocation.endLine + 1)
    ];
    
    return updatedLines.join('\n');
  }

  private findElementInHTML(
    lines: string[],
    elementId: string
  ): { startLine: number; endLine: number } | null {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for element by ID, class, or data attribute
      if (line.includes(`id="${elementId}"`) || 
          line.includes(`class="${elementId}"`) ||
          line.includes(`data-element="${elementId}"`)) {
        
        const startLine = i;
        const endLine = this.findElementEndLine(lines, i, elementId);
        
        return { startLine, endLine };
      }
    }
    
    return null;
  }

  private findElementEndLine(lines: string[], startLine: number, elementId: string): number {
    const startTag = lines[startLine].match(/<(\w+)/)?.[1];
    if (!startTag) return startLine;
    
    let depth = 0;
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Count opening tags
      const openTags = (line.match(new RegExp(`<${startTag}(?:\\s|>)`, 'g')) || []).length;
      // Count closing tags
      const closeTags = (line.match(new RegExp(`</${startTag}>`, 'g')) || []).length;
      
      depth += openTags - closeTags;
      
      if (depth === 0 && i > startLine) {
        return i;
      }
    }
    
    return startLine;
  }

  private getAffectedLines(fullHTML: string, elementId: string): number[] {
    const lines = fullHTML.split('\n');
    const elementLocation = this.findElementInHTML(lines, elementId);
    
    if (!elementLocation) return [];
    
    const affectedLines: number[] = [];
    for (let i = elementLocation.startLine; i <= elementLocation.endLine; i++) {
      affectedLines.push(i);
    }
    
    return affectedLines;
  }

  private calculateAffectedLines(patches: any[]): number[] {
    const affectedLines: number[] = [];
    
    for (const patch of patches) {
      const startLine = patch.start1;
      const length = patch.length1;
      
      for (let i = startLine; i < startLine + length; i++) {
        affectedLines.push(i);
      }
    }
    
    return affectedLines;
  }

  generatePreviewPatch(
    oldContent: string,
    newContent: string
  ): { 
    preview: string; 
    stats: { additions: number; deletions: number; modifications: number } 
  } {
    const diffs = this.dmp.diff_main(oldContent, newContent);
    this.dmp.diff_cleanupSemantic(diffs);
    
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    for (const [operation, text] of diffs) {
      const lineCount = text.split('\n').length - 1;
      
      switch (operation) {
        case 1: // INSERT
          additions += lineCount;
          break;
        case -1: // DELETE
          deletions += lineCount;
          break;
        case 0: // EQUAL
          // No change
          break;
      }
    }
    
    // If we have both additions and deletions, count as modifications
    if (additions > 0 && deletions > 0) {
      modifications = Math.min(additions, deletions);
      additions -= modifications;
      deletions -= modifications;
    }
    
    const preview = this.dmp.diff_prettyHtml(diffs);
    
    return {
      preview,
      stats: { additions, deletions, modifications }
    };
  }
}