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
    const lines = notesText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return { title: '', description: '' };
    }

    const title = lines[0];
    const description = lines.slice(1).join('\n');

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
        const acLines = lines.length > 1 ? lines.slice(1) : [description];
        const acceptanceCriteria = formatAsAcceptanceCriteria(acLines);
        result = result.replace(/Acceptance Criteria:[\s\S]*?(?=\n\w|$)/m, `Acceptance Criteria:\n${acceptanceCriteria}`);
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
    const artifactType = document.getElementById('artifactType').value;
    const outputElement = document.getElementById('output');

    if (!notesInput.trim()) {
        outputElement.textContent = 'Please enter some notes to generate an artifact.';
        return;
    }

    const parsedNotes = parseNotes(notesInput);
    const template = templates[artifactType];
    const result = generateArtifact(template, parsedNotes);

    outputElement.textContent = result;
    showNotification('Artifact generated successfully!');
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
    
    // Optional: Add brief visual feedback by changing button text
    const btn = event.target;
    if (btn && btn.id === 'generateBtn') {
        const originalText = btn.textContent;
        btn.textContent = '✓ Generated!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 1500);
    }
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

    // Allow Enter key in artifact type to trigger generation
    document.getElementById('artifactType').addEventListener('change', () => {
        // Optional: auto-generate when type changes if there's already input
        // Uncomment the line below if desired:
        // if (document.getElementById('notesInput').value) { handleGenerate(); }
    });

    console.log('Agile Artifact Generator initialized');
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
