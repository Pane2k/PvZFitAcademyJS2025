export default class TextComponent {
    constructor(config) {
        const safeConfig = config || {}; 
        this.text = safeConfig.text || '';
        this.font = safeConfig.font || '16px Arial';
        this.color = safeConfig.color || 'white';
        this.textAlign = safeConfig.textAlign || 'center';
        this.textBaseline = safeConfig.textBaseline || 'middle';
    }
}