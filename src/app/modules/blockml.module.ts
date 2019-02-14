import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TreeModule } from 'angular-tree-component';
import * as components from '@app/components/_index';
import { MyCovalentModule } from '@app/modules/my-covalent.module';
import { MyMaterialModule } from '@app/modules/my-material.module';
import { SharedModule } from '@app/modules/shared.module';
import { ValidationMsgModule } from '@app/modules/validation-msg.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    MyMaterialModule,
    FlexLayoutModule,
    RouterModule,
    ReactiveFormsModule,
    TreeModule,
    ValidationMsgModule,
    MyCovalentModule
  ],
  declarations: [
    components.BlockMLComponent,
    components.CatalogTreeComponent,
    components.FileEditorComponent,
    components.ErrorsComponent
  ],
  entryComponents: [],
  exports: [components.BlockMLComponent]
})
export class BlockMLModule {}
