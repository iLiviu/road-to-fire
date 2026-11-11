import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { LabelCategory } from '../../models/label-category';
import { Label } from '../../models/label';

@Component({
    selector: 'app-labels-settings',
    templateUrl: './labels-settings.component.html',
    styleUrls: ['./labels-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelsSettingsComponent implements OnInit {

    categories: LabelCategory[] = [];
    labelsByCategory: { [categoryId: number]: Label[] } = {};

    constructor(
        private portfolioService: PortfolioService,
        private dialogsService: DialogsService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    async loadData() {
        this.categories = await this.portfolioService.getLabelCategories();
        const allLabels = await this.portfolioService.getLabels();

        this.labelsByCategory = {};
        for (const category of this.categories) {
            this.labelsByCategory[category.id] = [];
        }

        for (const label of allLabels) {
            if (label.category) {
                if (!this.labelsByCategory[label.category.id]) {
                    this.labelsByCategory[label.category.id] = [];
                }
                this.labelsByCategory[label.category.id].push(label);
            }
        }
        this.cdr.markForCheck();
    }

    async addCategory() {
        const name = await this.dialogsService.input('Enter category name:');
        if (name && name.trim()) {
            const category = new LabelCategory({ name: name.trim() });
            await this.portfolioService.addLabelCategory(category);
            await this.loadData();
        }
    }

    async editCategory(category: LabelCategory) {
        const name = await this.dialogsService.input('Edit category name:', '', category.name);
        if (name && name.trim()) {
            category.name = name.trim();
            await this.portfolioService.updateLabelCategory(category);
            await this.loadData();
        }
    }

    async deleteCategory(category: LabelCategory) {
        const confirmed = await this.dialogsService.confirm(`Are you sure you want to delete category "${category.name}" and all its labels?`);
        if (confirmed) {
            await this.portfolioService.removeLabelCategory(category);
            await this.loadData();
        }
    }

    async addLabel(category: LabelCategory) {
        const name = await this.dialogsService.input(`Enter label name for ${category.name}:`);
        if (name && name.trim()) {
            const label = new Label({ name: name.trim(), category: category });
            await this.portfolioService.addLabel(label);
            await this.loadData();
        }
    }

    async editLabel(label: Label) {
        const name = await this.dialogsService.input('Edit label name:', '', label.name);
        if (name && name.trim()) {
            label.name = name.trim();
            await this.portfolioService.updateLabel(label);
            await this.loadData();
        }
    }

    async deleteLabel(label: Label) {
        const confirmed = await this.dialogsService.confirm(`Are you sure you want to delete label "${label.name}"?`);
        if (confirmed) {
            await this.portfolioService.removeLabel(label);
            await this.loadData();
        }
    }

}
