package com.knust.codequest.sessionservice.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "com.knust.codequest.sessionservice", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule serviceLayerShouldNotDependOnControllerLayer =
            noClasses()
                    .that().resideInAPackage("..service..")
                    .should().dependOnClassesThat()
                    .resideInAPackage("..controller..");

    @ArchTest
    static final ArchRule repositoryLayerShouldNotDependOnServiceLayer =
            noClasses()
                    .that().resideInAPackage("..repository..")
                    .should().dependOnClassesThat()
                    .resideInAPackage("..service..");

    @ArchTest
    static final ArchRule controllerClassesShouldBeInControllerPackage =
            classes()
                    .that().haveSimpleNameEndingWith("Controller")
                    .should().resideInAPackage("..controller..");

    @ArchTest
    static final ArchRule serviceClassesShouldBeInServicePackage =
            classes()
                    .that().haveSimpleNameEndingWith("Service")
                    .should().resideInAPackage("..service..");

    @ArchTest
    static final ArchRule repositoryClassesShouldBeInRepositoryPackage =
            classes()
                    .that().haveSimpleNameEndingWith("Repository")
                    .should().resideInAPackage("..repository..");

    @ArchTest
    static final ArchRule dtoClassesShouldBeInDtoPackage =
            classes()
                    .that().haveSimpleNameEndingWith("Dto")
                    .or().haveSimpleNameEndingWith("Request")
                    .should().resideInAPackage("..dto..");

    @ArchTest
    static final ArchRule entityClassesShouldBeInEntityPackage =
            classes()
                    .that().haveSimpleNameEndingWith("Session")
                    .and().areNotNestedClasses()
                    .or().haveSimpleNameEndingWith("Answer")
                    .should().resideInAPackage("..entity..");

    @ArchTest
    static final ArchRule mapperClassesShouldBeInMapperPackage =
            classes()
                    .that().haveSimpleNameEndingWith("Mapper")
                    .should().resideInAPackage("..mapper..").allowEmptyShould(true);

    @ArchTest
    static final ArchRule noCyclicDependencies =
            slices()
                    .matching("com.knust.codequest.sessionservice.(*)..")
                    .should().beFreeOfCycles();

    @ArchTest
    static final ArchRule enumsShouldBeInEnumsPackage =
            classes()
                    .that().areEnums()
                    .should().resideInAPackage("..enums..");

    @ArchTest
    static final ArchRule controllersShouldNotAccessRepositoriesDirectly =
            noClasses()
                    .that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat()
                    .haveSimpleNameEndingWith("Repository");

    @ArchTest
    static final ArchRule servicesShouldNotAccessEntitiesFromOtherPackages =
            noClasses()
                    .that().resideInAPackage("..service..")
                    .should().dependOnClassesThat()
                    .resideInAPackage("..controller..");
}
