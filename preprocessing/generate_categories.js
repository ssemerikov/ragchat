/**
 * Category Generation Script
 * Generates categories.json with all 12 document categories
 * Includes Ukrainian and English names
 */

import { promises as fs } from 'fs';

// Configuration
const OUTPUT_FILE = './output/categories.json';
const METADATA_INPUT = './metadata/extracted_documents.json';

// 12 Categories from KDPU website
const CATEGORIES = [
    {
        id: 'general_operations',
        name_uk: 'Загальна діяльність',
        name_en: 'General Operations',
        icon: '📋',
        description_uk: 'Статут університету, колективний договір, програма розвитку',
        description_en: 'University charter, collective agreement, development program'
    },
    {
        id: 'anti_corruption',
        name_uk: 'Антикорупційна діяльність',
        name_en: 'Anti-Corruption Activities',
        icon: '🛡️',
        description_uk: 'Програми запобігання корупції, реєстр ризиків',
        description_en: 'Corruption prevention programs, risk register'
    },
    {
        id: 'academic_council',
        name_uk: 'Вчена рада',
        name_en: 'Academic Council',
        icon: '🎓',
        description_uk: 'Положення про вчену раду та постійні комісії',
        description_en: 'Regulations for academic council and commissions'
    },
    {
        id: 'structural_divisions',
        name_uk: 'Структурні підрозділи',
        name_en: 'Structural Divisions',
        icon: '🏛️',
        description_uk: 'Положення про факультети та кафедри',
        description_en: 'Provisions for faculties and departments'
    },
    {
        id: 'educational_process',
        name_uk: 'Освітній процес',
        name_en: 'Educational Process',
        icon: '📚',
        description_uk: 'Організація навчального процесу, академічна доброчесність',
        description_en: 'Educational process organization, academic integrity'
    },
    {
        id: 'scientific_work',
        name_uk: 'Наукова робота',
        name_en: 'Scientific Work',
        icon: '🔬',
        description_uk: 'Наукова діяльність, публікації, дослідження',
        description_en: 'Scientific activities, publications, research'
    },
    {
        id: 'financial_activities',
        name_uk: 'Фінансова діяльність',
        name_en: 'Financial Activities',
        icon: '💰',
        description_uk: 'Публічні закупівлі, платні послуги',
        description_en: 'Public procurement, paid services'
    },
    {
        id: 'information_activities',
        name_uk: 'Інформаційна діяльність',
        name_en: 'Information Activities',
        icon: '📱',
        description_uk: 'Управління веб-сайтом, прес-центр',
        description_en: 'Website management, press center'
    },
    {
        id: 'social_civic',
        name_uk: 'Соціально-виховна діяльність',
        name_en: 'Social-Civic Activities',
        icon: '🤝',
        description_uk: 'Підтримка студентів, гендерна освіта, мовні центри',
        description_en: 'Student support, gender education, language centers'
    },
    {
        id: 'dormitories',
        name_uk: 'Гуртожитки',
        name_en: 'Dormitories',
        icon: '🏠',
        description_uk: 'Положення про гуртожитки, правила внутрішнього розпорядку',
        description_en: 'Dormitory regulations, internal rules'
    },
    {
        id: 'hr_management',
        name_uk: 'Кадрові питання',
        name_en: 'Personnel Issues',
        icon: '👥',
        description_uk: 'Прийом на роботу, облік робочого часу',
        description_en: 'Hiring procedures, work time accounting'
    },
    {
        id: 'safety',
        name_uk: 'Охорона праці',
        name_en: 'Occupational Safety',
        icon: '⚠️',
        description_uk: 'Програми навчання з охорони праці, процедури безпеки',
        description_en: 'Safety training programs, emergency procedures'
    }
];

class CategoryGenerator {
    constructor() {
        this.documentCounts = {};
    }

    /**
     * Main generation function
     */
    async generate() {
        console.log('Generating categories.json...');

        try {
            // Create output directory
            await fs.mkdir('./output', { recursive: true });

            // Calculate document counts per category
            console.log('\n1. Calculating document counts per category...');
            await this.calculateDocumentCounts();

            // Generate categories data
            console.log('\n2. Generating categories data...');
            const categoriesData = this.generateCategoriesData();

            // Save to file
            console.log('\n3. Saving categories.json...');
            await this.saveCategories(categoriesData);

            // Summary
            console.log('\n=== Category Generation Complete ===');
            console.log(`Total categories: ${CATEGORIES.length}`);
            console.log(`Output: ${OUTPUT_FILE}`);

            // Display category counts
            console.log('\nDocument counts per category:');
            CATEGORIES.forEach(cat => {
                const count = this.documentCounts[cat.id] || 0;
                console.log(`  ${cat.icon} ${cat.name_uk}: ${count} documents`);
            });

        } catch (error) {
            console.error('Category generation failed:', error);
            throw error;
        }
    }

    /**
     * Calculate document counts per category
     */
    async calculateDocumentCounts() {
        try {
            const content = await fs.readFile(METADATA_INPUT, 'utf8');
            const metadata = JSON.parse(content);

            // Count documents per category
            metadata.documents.forEach(doc => {
                const category = doc.category || 'uncategorized';
                this.documentCounts[category] = (this.documentCounts[category] || 0) + 1;
            });

            console.log(`Analyzed ${metadata.documents.length} documents`);

        } catch (error) {
            console.warn('Could not load document metadata, continuing without counts...');
        }
    }

    /**
     * Generate categories data structure
     */
    generateCategoriesData() {
        const categories = CATEGORIES.map(cat => ({
            ...cat,
            document_count: this.documentCounts[cat.id] || 0
        }));

        return {
            version: '1.0',
            generated_at: new Date().toISOString(),
            total_categories: categories.length,
            categories
        };
    }

    /**
     * Save categories to JSON file
     */
    async saveCategories(data) {
        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(data, null, 2),
            'utf8'
        );

        console.log(`Categories saved: ${OUTPUT_FILE}`);

        const fileSize = (await fs.stat(OUTPUT_FILE)).size;
        console.log(`File size: ${(fileSize / 1024).toFixed(2)} KB`);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new CategoryGenerator();
    generator.generate()
        .then(() => {
            console.log('\nCategory generation completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nCategory generation failed:', error);
            process.exit(1);
        });
}

export default CategoryGenerator;
