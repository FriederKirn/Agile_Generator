// ============================================
// Agile Artifact Generator - JavaScript
// ============================================

// ============================================
// Default Templates
// ============================================

const DEFAULT_TEMPLATES = {
    epic: `Title:
Description:
Problem Statement:
Business Value:
Success Criteria:`,
    
    feature: `Title:
Description:
User Story:
Acceptance Criteria:`,
    
    requirement: `Title:
Description:
Requirement:
Acceptance Criteria:`
};

// ============================================
// Storage Management
// ============================================

/**
 * Load templates from localStorage, or use defaults if not found
 */
function loadTemplates() {
    const stored = localStorage.getItem('agileTemplates');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse stored templates', e);
            return DEFAULT_TEMPLATES;
        }
    }
    return DEFAULT_TEMPLATES;
}

/**
 * Save templates to localStorage
 */
function saveTemplates(templates) {
    try {
        localStorage.setItem('agileTemplates', JSON.stringify(templates));
    } catch (e) {
        console.error('Failed to save templates to localStorage', e);
        alert('Failed to save templates. Your changes may not persist.');
    }
}

// ============================================
// Template Management
// ============================================

let templates = loadTemplates();

/**
 * Initialize template editors with current templates
 */
function initializeTemplateEditors() {
    document.getElementById('epicTemplate').value = templates.epic;
    document.getElementById('featureTemplate').value = templates.feature;
    document.getElementById('requirementTemplate').value = templates.requirement;
}

/**
 * Update template when user edits
 */
function setupTemplateListeners() {
    document.getElementById('epicTemplate').addEventListener('change', (e) => {
        templates.epic = e.target.value;
        saveTemplates(templates);
        showNotification('Epic template saved');
    });

    document.getElementById('featureTemplate').addEventListener('change', (e) => {
        templates.feature = e.target.value;
        saveTemplates(templates);
        showNotification('Feature template saved');
    });

    document.getElementById('requirementTemplate').addEventListener('change', (e) => {
        templates.requirement = e.target.value;
        saveTemplates(templates);
        showNotification('Requirement template saved');
    });

    // Reset template buttons
    document.querySelectorAll('.btn-reset-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateType = e.target.dataset.template;
            if (confirm(`Reset ${templateType} template to default?`)) {
                templates[templateType] = DEFAULT_TEMPLATES[templateType];
                saveTemplates(templates);
                initializeTemplateEditors();
                showNotification(`${templateType} template reset to default`);
            }
        });
    });
}

// ============================================
// Generation Logic
// ============================================

/**
 * Parse input notes into structured data
 */
function parseNotes(notesText) {
    const trimmedText = notesText.trim();
    if (!trimmedText) {
        return { title: '', description: '', lines: [] };
    }

    const lines = trimmedText.split('\n').map(line => line.trim()).filter(line => line);
    let title = 'Meeting Notes';

    const explicitTitleLine = lines.find(line => /^\s*(Title|Subject)\s*[:\-]/i.test(line));
    if (explicitTitleLine) {
        title = explicitTitleLine.replace(/^\s*(Title|Subject)\s*[:\-]\s*/i, '').trim();
    } else if (lines.length === 1) {
        title = lines[0];
    }

    const description = trimmedText;
    return { title, description, lines };
}

/**
 * Convert description to user story format
 */
function formatAsUserStory(title, description) {
    return `As a user, I want ${title}, so that ${description}`;
}

/**
 * Convert lines into acceptance criteria format (bullet points)
 */
function formatAsAcceptanceCriteria(lines) {
    return lines.map(line => `- ${line.trim()}`).join('\n');
}

function normalizeText(text) {
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/[\u2022\u2023\u25E6]/g, '-')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanConversationFragment(fragment) {
    let cleaned = fragment.replace(/(^|\n)[A-Z][a-z0-9]+(?: [A-Z][a-z0-9]+)?:\s*/g, '$1');
    cleaned = cleaned.replace(/(^|\n)\s*[-_*]{3,}\s*(?=\n|$)/g, '$1');
    cleaned = cleaned.replace(/(^|\n)\s*[-*]\s+/g, '$1');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

function splitIntoFragments(notesText) {
    const normalized = normalizeText(notesText);
    if (!normalized) {
        return [];
    }

    const paragraphs = normalized
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    const fragments = [];
    paragraphs.forEach(paragraph => {
        const lines = paragraph.split('\n').map(line => line.trim()).filter(Boolean);
        const bullets = lines.filter(line => /^([\-*]|\d+[\.\)])\s+/.test(line));
        if (bullets.length === lines.length && lines.length > 1) {
            bullets.forEach(line => {
                const cleanedLine = cleanConversationFragment(line.replace(/^([\-*]|\d+[\.\)])\s+/, '').trim());
                if (cleanedLine) fragments.push(cleanedLine);
            });
        } else {
            const cleanedParagraph = cleanConversationFragment(lines.join(' '));
            if (cleanedParagraph) fragments.push(cleanedParagraph);
        }
    });

    return fragments.filter(Boolean);
}

function countMatches(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.reduce((count, keyword) => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
        return count + (pattern.test(lower) ? 1 : 0);
    }, 0);
}

function classifyFragment(fragment) {
    const text = normalizeText(fragment).toLowerCase();
    const epicKeywords = ['initiative', 'outcome', 'strategy', 'capability', 'theme', 'workflow', 'platform', 'major', 'roadmap', 'vision', 'objective', 'goal', 'problem', 'value', 'improve', 'enhance', 'simplify', 'streamline', 'automate', 'consistency', 'inconsistent', 'performance', 'preview', 'template', 'versioning', 'annotation', 'annotations', 'usability', 'experience'];
    const featureKeywords = ['allow', 'enable', 'provide', 'support', 'generate', 'manage', 'create', 'update', 'configure', 'review', 'publish', 'select', 'edit', 'validate', 'display', 'search', 'filter', 'connect', 'integrate', 'sync', 'approve', 'share', 'import', 'export', 'save', 'preview', 'template', 'versioning', 'annotation', 'annotations', 'checklist', 'tree', 'background', 'detect', 'suggest', 'block', 'warning', 'prevent'];
    const requirementKeywords = ['must', 'shall', 'should', 'required', 'required inputs', 'input', 'only if', 'when', 'then', 'validate', 'warn', 'prevent', 'display', 'store', 'export', 'authenticate', 'authorize', 'error', 'constraint', 'rule', 'condition', 'permission', 'if', 'block', 'warning', 'validation', 'versioning'];
    const openQuestionKeywords = ['open question', 'should we', 'could we', 'would we', 'is there', 'do we', 'need to decide', 'need to confirm', 'unknown', 'unclear', 'decide', 'decision', 'question'];

    if (openQuestionKeywords.some(keyword => text.includes(keyword)) || fragment.trim().endsWith('?')) {
        return { type: 'open_question', confidenceScore: 0.55, classificationRationale: 'Detected an unresolved question or decision item.' };
    }

    const epicScore = countMatches(text, epicKeywords);
    const featureScore = countMatches(text, featureKeywords);
    const requirementScore = countMatches(text, requirementKeywords) * 1.3;

    if (requirementScore >= Math.max(featureScore, epicScore) && requirementScore >= 1) {
        return { type: 'requirement', confidenceScore: Math.min(0.95, 0.4 + requirementScore * 0.1), classificationRationale: 'Detected specific, testable requirement phrasing.' };
    }

    if (featureScore >= Math.max(epicScore, requirementScore) && featureScore >= 1) {
        return { type: 'feature', confidenceScore: Math.min(0.95, 0.35 + featureScore * 0.1), classificationRationale: 'Detected user-facing capability language.' };
    }

    if (epicScore >= Math.max(featureScore, requirementScore) && epicScore >= 1) {
        return { type: 'epic', confidenceScore: Math.min(0.95, 0.35 + epicScore * 0.1), classificationRationale: 'Detected outcome-oriented or initiative language.' };
    }

    const words = fragment.split(/\s+/).filter(Boolean).length;
    if (words <= 10 && requirementScore > 0) {
        return { type: 'requirement', confidenceScore: 0.55, classificationRationale: 'Short requirement-like fragment.' };
    }
    if (featureScore > 0 || /\b(preview|template|versioning|annotation|checklist|tree|export|support|validation|blocking|prevent|error|warning|background)\b/i.test(text)) {
        return { type: 'feature', confidenceScore: 0.55, classificationRationale: 'Fragment resembles a capability or product behavior.' };
    }

    return { type: 'epic', confidenceScore: 0.45, classificationRationale: 'Defaulting to epic-level outcome when no clear lower-level classification applies.' };
}

function extractTitle(fragment, type) {
    let title = fragment.replace(/^([\-*]|\d+[\.\)])\s+/, '').trim();
    title = title.replace(/^(As a user|As an admin|As a .*?,)\s*/i, '');
    title = title.replace(/^(The system|System|Application|App)\s+/i, '');
    title = title.replace(/[.?!]$/, '').trim();

    if (!title) {
        return type === 'epic' ? 'Inferred Epic' : type === 'feature' ? 'Inferred Feature' : 'Inferred Requirement';
    }
    return title.length > 120 ? `${title.slice(0, 120).trim()}...` : title;
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function lowerFirst(text) {
    if (!text) return '';
    return text.charAt(0).toLowerCase() + text.slice(1);
}

function formatTitleForType(fragment, type) {
    const cleaned = extractTitle(fragment, type);
    if (type === 'requirement') {
        if (/^(the system must|must|shall|should|when|if|given|then)\b/i.test(cleaned)) {
            return capitalize(cleaned);
        }
        return capitalize(`The system must ${lowerFirst(cleaned)}`);
    }

    if (type === 'feature') {
        if (/^(allow|enable|provide|support|generate|manage|create|update|configure|review|publish|select|edit|validate|display|search|filter|connect|integrate|sync|approve|share|import|export|save)\b/i.test(cleaned)) {
            return capitalize(cleaned);
        }
        return capitalize(`Enable users to ${lowerFirst(cleaned)}`);
    }

    if (type === 'epic') {
        const noIntro = cleaned.replace(/^(we need|need to|need|allow us to|allow us|allows us to|helps us to|we should|we want to)\s+/i, '');
        if (/^(improve|increase|reduce|streamline|automate|enhance|simplify|enable|support|provide)\b/i.test(noIntro)) {
            return capitalize(noIntro);
        }
        return capitalize(`Improve ${lowerFirst(noIntro)}`);
    }

    return capitalize(cleaned);
}

function extractAcceptanceCriteria(text) {
    const sentences = text.split(/[.?!]\s*/).map(s => s.trim()).filter(Boolean);
    if (sentences.length > 1) {
        return sentences.map(s => s);
    }
    if (/\b(given|when|then|should|must)\b/i.test(text)) {
        return [text.trim()];
    }
    return [];
}

function createBacklogItem(fragment, index) {
    const classification = classifyFragment(fragment);
    const type = classification.type;
    const title = formatTitleForType(fragment, type);
    const now = new Date().toISOString();

    const item = {
        id: `${type.toUpperCase().slice(0, 4)}-${String(index).padStart(3, '0')}`,
        type,
        title,
        parentId: null,
        children: [],
        sourceNoteIds: [`NOTE-${String(index).padStart(3, '0')}`],
        sourceSnippets: [fragment.trim()],
        classificationRationale: classification.classificationRationale,
        confidenceScore: classification.confidenceScore,
        inferred: false,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        rawText: fragment.trim(),
        fields: {}
    };

    if (type === 'epic') {
        item.fields = {
            summary: fragment.trim(),
            problem_statement: '',
            business_value: '',
            user_value: '',
            scope: '',
            out_of_scope: '',
            related_notes: [fragment.trim()],
            confidence_score: classification.confidenceScore
        };
    } else if (type === 'feature') {
        item.fields = {
            summary: fragment.trim(),
            user_goal: fragment.trim(),
            functional_description: '',
            priority: 'Medium',
            dependencies: [],
            assumptions: [],
            related_notes: [fragment.trim()],
            confidence_score: classification.confidenceScore
        };
    } else if (type === 'requirement') {
        item.fields = {
            requirement_statement: fragment.trim(),
            type: 'Functional',
            acceptance_criteria: extractAcceptanceCriteria(fragment),
            source_note_references: [`NOTE-${String(index).padStart(3, '0')}`],
            priority: 'Medium',
            validation_rules: [],
            confidence_score: classification.confidenceScore
        };
    } else {
        item.fields = {
            summary: fragment.trim(),
            note_type: type,
            confidence_score: classification.confidenceScore
        };
    }

    return item;
}

function countKeywordOverlap(source, target) {
    const left = new Set(normalizeText(source).toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const right = new Set(normalizeText(target).toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    let overlap = 0;
    left.forEach(word => {
        if (right.has(word)) {
            overlap += 1;
        }
    });
    return overlap;
}

function generateInferredItem(type, referenceItem, titleSuffix) {
    const title = `Inferred ${type.charAt(0).toUpperCase() + type.slice(1)}${titleSuffix ? `: ${titleSuffix}` : ''}`;
    const now = new Date().toISOString();
    return {
        id: `${type.toUpperCase().slice(0, 4)}-INF-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        type,
        title,
        parentId: null,
        children: [],
        sourceNoteIds: referenceItem ? referenceItem.sourceNoteIds.slice() : [],
        sourceSnippets: referenceItem ? referenceItem.sourceSnippets.slice() : [],
        classificationRationale: `Inferred ${type} to preserve hierarchy for related backlog items.`,
        confidenceScore: 0.45,
        inferred: true,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        rawText: referenceItem ? referenceItem.rawText : '',
        fields: type === 'epic' ? {
            summary: referenceItem ? referenceItem.rawText : 'Inferred epic from note context.',
            problem_statement: '',
            business_value: '',
            user_value: '',
            scope: '',
            out_of_scope: '',
            related_notes: referenceItem ? referenceItem.sourceSnippets.slice() : [],
            confidence_score: 0.45
        } : type === 'feature' ? {
            summary: referenceItem ? referenceItem.rawText : 'Inferred feature from note context.',
            user_goal: '',
            functional_description: '',
            priority: 'Medium',
            dependencies: [],
            assumptions: [],
            related_notes: referenceItem ? referenceItem.sourceSnippets.slice() : [],
            confidence_score: 0.45
        } : {
            requirement_statement: referenceItem ? referenceItem.rawText : 'Inferred requirement from note context.',
            type: 'Functional',
            acceptance_criteria: [],
            source_note_references: referenceItem ? referenceItem.sourceNoteIds.slice() : [],
            priority: 'Medium',
            validation_rules: [],
            confidence_score: 0.45
        }
    };
}

function detectTopics(items) {
    const keywordCounts = {};
    items.forEach(item => {
        normalizeText(item.rawText).split(/\s+/).forEach(word => {
            if (word.length >= 4) {
                keywordCounts[word] = (keywordCounts[word] || 0) + 1;
            }
        });
    });

    return Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([keyword], index) => ({
            id: `TOPIC-${String(index + 1).padStart(3, '0')}`,
            name: keyword,
            description: `Notes related to ${keyword}.`, 
            source_note_ids: items.filter(item => normalizeText(item.rawText).includes(keyword)).flatMap(item => item.sourceNoteIds)
        }));
}

function countItems(items, type) {
    let count = 0;
    items.forEach(item => {
        if (item.type === type) count += 1;
        if (item.children && item.children.length) {
            count += countItems(item.children, type);
        }
    });
    return count;
}

function formatBacklogTree(item, depth = 0) {
    const indent = '  '.repeat(depth);
    const inferredTag = item.inferred ? ' (inferred)' : '';
    const header = `${indent}${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.title}${inferredTag}`;
    const lines = [header];

    if (item.type === 'feature' && item.fields && item.fields.user_goal) {
        lines.push(`${indent}  User Goal: ${item.fields.user_goal}`);
        lines.push(`${indent}  Description: ${item.fields.summary}`);
    }
    if (item.type === 'requirement' && item.fields && item.fields.requirement_statement) {
        lines.push(`${indent}  Statement: ${item.fields.requirement_statement}`);
        if (item.fields.acceptance_criteria && item.fields.acceptance_criteria.length) {
            lines.push(`${indent}  Acceptance Criteria:`);
            item.fields.acceptance_criteria.forEach(ac => lines.push(`${indent}  - ${ac}`));
        }
    }

    item.children.forEach(child => {
        lines.push(formatBacklogTree(child, depth + 1));
    });
    return lines.join('\n');
}

function formatBacklogResult(result) {
    const epicCount = countItems(result.backlog_items, 'epic');
    const featureCount = countItems(result.backlog_items, 'feature');
    const requirementCount = countItems(result.backlog_items, 'requirement');
    const lines = [`Summary: ${result.summary}`];
    lines.push(`Detected: ${epicCount} epic(s), ${featureCount} feature(s), ${requirementCount} requirement(s).`);
    lines.push('All requirements are attached to features and all features are attached to epics.');

    if (result.detected_topics.length) {
        lines.push('\nDetected topics:');
        result.detected_topics.forEach(topic => {
            lines.push(`- ${topic.name} (${topic.source_note_ids.length} note refs)`);
        });
    }

    if (result.backlog_items.length) {
        lines.push('\nBacklog Structure:');
        result.backlog_items.forEach(item => {
            if (!item.parentId) {
                lines.push(formatBacklogTree(item));
            }
        });
    }

    if (result.open_questions.length) {
        lines.push('\nOpen Questions:');
        result.open_questions.forEach(question => {
            lines.push(`- ${question.rawText} [confidence=${question.confidenceScore.toFixed(2)}]`);
        });
    }

    return lines.join('\n');
}

function selectBestParent(child, parents) {
    let bestParent = null;
    let bestScore = 0;
    const childKeywords = new Set(normalizeText(child.rawText).toLowerCase().split(/\s+/));
    parents.forEach(parent => {
        const parentKeywords = new Set(normalizeText(parent.rawText).toLowerCase().split(/\s+/));
        const score = [...childKeywords].reduce((sum, word) => sum + (parentKeywords.has(word) ? 1 : 0), 0);
        if (score > bestScore) {
            bestScore = score;
            bestParent = parent;
        }
    });
    return bestParent;
}

function generateBacklog(notesText) {
    const fragments = splitIntoFragments(notesText);
    const uniqueFragments = [...new Map(fragments.map(fragment => [normalizeText(fragment), fragment])).values()];
    const items = uniqueFragments.map((fragment, index) => createBacklogItem(fragment, index + 1));
    const epics = items.filter(item => item.type === 'epic');
    const features = items.filter(item => item.type === 'feature');
    const requirements = items.filter(item => item.type === 'requirement');
    const openQuestions = items.filter(item => item.type === 'open_question');

    features.forEach(feature => {
        if (!feature.parentId) {
            const parent = selectBestParent(feature, epics);
            if (parent) {
                feature.parentId = parent.id;
                parent.children.push(feature);
            }
        }
    });

    requirements.forEach(requirement => {
        if (!requirement.parentId) {
            const parentFeature = selectBestParent(requirement, features);
            if (parentFeature) {
                requirement.parentId = parentFeature.id;
                parentFeature.children.push(requirement);
            }
        }
    });

    if (features.length > 0 && epics.length === 0) {
        const inferredEpic = generateInferredItem('epic', features[0], 'Inferred epic from note clusters');
        epics.push(inferredEpic);
        items.push(inferredEpic);
        features.forEach(feature => {
            if (!feature.parentId) {
                feature.parentId = inferredEpic.id;
                inferredEpic.children.push(feature);
            }
        });
    }

    if (requirements.length > 0 && features.length === 0) {
        const inferredFeature = generateInferredItem('feature', requirements[0], 'Inferred feature for requirements');
        features.push(inferredFeature);
        items.push(inferredFeature);
        if (epics.length > 0) {
            inferredFeature.parentId = epics[0].id;
            epics[0].children.push(inferredFeature);
        }
        requirements.forEach(requirement => {
            if (!requirement.parentId) {
                requirement.parentId = inferredFeature.id;
                inferredFeature.children.push(requirement);
            }
        });
    }

    if (requirements.length > 0 && features.length > 0) {
        requirements.forEach(requirement => {
            if (!requirement.parentId) {
                const inferredFeature = generateInferredItem('feature', requirement, 'Inferred feature for requirement');
                features.push(inferredFeature);
                items.push(inferredFeature);
                if (epics.length > 0) {
                    inferredFeature.parentId = epics[0].id;
                    epics[0].children.push(inferredFeature);
                }
                requirement.parentId = inferredFeature.id;
                inferredFeature.children.push(requirement);
            }
        });
    }

    const rootItems = epics.length ? epics : features.length ? features : requirements;
    const detectedTopics = detectTopics(items);

    return {
        summary: 'Generated structured backlog using Epic > Feature > Requirement hierarchy.',
        detected_topics: detectedTopics,
        backlog_items: rootItems,
        open_questions: openQuestions
    };
}

function extractSuccessMetricLines(lines) {
    return lines.filter(line => /success|metric|measure|goal|outcome|KPI|criterion|criteria/i.test(line));
}

function inferSuccessCriteria(title, description, lines) {
    const explicitMetrics = extractSuccessMetricLines(lines);
    if (explicitMetrics.length) {
        return explicitMetrics.map(line => `- ${line.replace(/^\s*[-*]\s*/,'').trim()}`).join('\n');
    }

    const summary = description.length > 100 ? description : `${title}: ${description}`;
    const verb = /reduce|decrease|improve|increase|automate|streamline|remove|eliminate/i.test(summary)
        ? 'achieves'
        : 'delivers';

    return [`- The solution ${verb} the expected outcome described in the notes.`, `- Success is measured by delivering the intended value and making the problem easier to solve.`].join('\n');
}

/**
 * Generate artifact from template and notes
 */
function generateArtifact(template, parsedNotes) {
    const { title, description, lines } = parsedNotes;
    
    let result = template;

    // Replace placeholders with actual values
    // Handle Title placeholder
    result = result.replace(/Title:[\s\S]*?(?=\n\w|$)/m, `Title: ${title}`);

    // Handle Description placeholder
    result = result.replace(/Description:[\s\S]*?(?=\n\w|$)/m, `Description: ${description}`);

    // Handle User Story - special formatting
    if (result.includes('User Story:')) {
        const userStory = formatAsUserStory(title, description);
        result = result.replace(/User Story:[\s\S]*?(?=\n\w|$)/m, `User Story: ${userStory}`);
    }

    // Handle Acceptance Criteria - bullet point formatting
    if (result.includes('Acceptance Criteria:')) {
        const acLines = lines.length ? lines : [description];
        const acceptanceCriteria = formatAsAcceptanceCriteria(acLines);
        result = result.replace(/Acceptance Criteria:[\s\S]*?(?=\n\w|$)/m, `Acceptance Criteria:\n${acceptanceCriteria}`);
    }

    // Handle Success Criteria - infer a fitting metric if notes do not provide one explicitly
    if (result.includes('Success Criteria:')) {
        const successLines = extractSuccessMetricLines(lines);
        const successCriteria = successLines.length ? formatAsAcceptanceCriteria(successLines) : inferSuccessCriteria(title, description, lines);
        result = result.replace(/Success Criteria:[\s\S]*?(?=\n\w|$)/m, `Success Criteria:\n${successCriteria}`);
    }

    // Keep other placeholders as-is (Problem Statement, Business Value, Requirements, etc.)
    // They will appear with their labels but empty values if no matching data

    return result.trim();
}

// ============================================
// UI Event Handlers
// ============================================

/**
 * Handle Generate button click
 */
function handleGenerate() {
    const notesInput = document.getElementById('notesInput').value;
    const outputElement = document.getElementById('output');

    if (!notesInput.trim()) {
        outputElement.textContent = 'Please enter some notes to generate a backlog structure.';
        return;
    }

    const backlog = generateBacklog(notesInput);
    outputElement.textContent = formatBacklogResult(backlog);
    showNotification('Backlog structure generated successfully!');
}

/**
 * Handle Reset button click
 */
function handleReset() {
    document.getElementById('notesInput').value = '';
    document.getElementById('output').textContent = '';
    showNotification('Input and output cleared');
}

/**
 * Handle Copy button click
 */
async function handleCopy() {
    const outputElement = document.getElementById('output');
    const text = outputElement.textContent;

    if (!text || text === 'Output will appear here...') {
        alert('No output to copy. Generate an artifact first.');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!');
    } catch (err) {
        alert('Failed to copy to clipboard');
    }
    document.body.removeChild(textarea);
}

/**
 * Handle Settings panel toggle
 */
function handleSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.toggle('hidden');
    settingsPanel.classList.toggle('show');
}

/**
 * Show notification feedback
 */
function showNotification(message) {
    // Simple visual feedback - you could enhance this with a toast
    console.log('✓', message);
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    // Initialize template editors
    initializeTemplateEditors();

    // Setup template event listeners
    setupTemplateListeners();

    // Setup main button listeners
    document.getElementById('generateBtn').addEventListener('click', handleGenerate);
    document.getElementById('resetBtn').addEventListener('click', handleReset);
    document.getElementById('copyBtn').addEventListener('click', handleCopy);
    document.getElementById('settingsToggleBtn').addEventListener('click', handleSettingsToggle);

    // Allow Enter key in notes input to trigger generation (Ctrl+Enter)
    document.getElementById('notesInput').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleGenerate();
        }
    });

    // No output mode selection is required; generate backlog directly

    console.log('Agile Artifact Generator initialized');
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
