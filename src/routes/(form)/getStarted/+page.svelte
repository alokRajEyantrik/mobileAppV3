<script lang="ts">
    import { onMount } from 'svelte';
    import { loanData } from '$lib/stores/loanData';
    import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
    import baseSchema from '$lib/config/collateral-free-loans-schema.json';
    import homeLoanSchema from '$lib/config/homeLoanSchema.json';
    import jsonLogic from 'json-logic-js';
    import pincode_IN_Selected from '$lib/config/pincode_IN_Selected.json';
    import { writable, type Writable } from 'svelte/store';
    import { goto } from '$app/navigation';
    import TextField from '$lib/components/TextField.svelte';
    import RadioField from '$lib/components/RadioField.svelte';
    import SelectField from '$lib/components/SelectField.svelte';
    import CheckboxField from '$lib/components/CheckboxField.svelte';
    import TextareaField from '$lib/components/TextareaField.svelte';
    import DateField from '$lib/components/DateField.svelte';
    import NumberField from '$lib/components/NumberField.svelte';
    import MultipleSelectField from '$lib/components/MultipleSelectField.svelte';
    import DerivedSelect from '$lib/components/DerivedSelect.svelte';
    import { submitApplication } from '$lib/services/api';

    interface Question { id: string; type: any; question: string; description?: string; bindsTo?: string; bindsTo_template?: string; options?: any[]; required?: boolean; showWhen?: any; errorMessage?: any; uiMeta?: any; contextKey?: string; }
    interface Page { title?: string; questions: Question[]; nextButtonVisibility?: { mode: string[] }; }
    interface Schema { pages: Page[]; includeSchemaWhen?: any[] }
    interface Answers { [key: string]: any; }

    let selectedLoan = '';
    let currentPageIndex = 0;
    let schema: Schema;
    let isSubmitting = false;
    let submitError: string | null = null;

    const gstStateError: Writable<string> = writable('');

    // ---- SPLIT-MERGE LOGIC ----
    function mergeHomeLoanSplit(base: Schema, homeLoan: Schema): Schema {
        console.log("🔹 mergeHomeLoanSplit CALLED");
        const merged: Schema = { ...base, pages: [...base.pages] };

        const hlFirstPageQuestions = [...homeLoan.pages[0].questions];
        console.log("HL First Page Questions IDs:", hlFirstPageQuestions.map(q => q.id));

        const [firstHLQ, ...restHLQ] = hlFirstPageQuestions;

        if (firstHLQ) {
            const idx = merged.pages[0].questions.findIndex(q => q.id === 'q1_loanName');
            console.log("Index of q1_loanName:", idx);
            const updatedQs = [...merged.pages[0].questions];
            updatedQs.splice(idx + 1, 0, firstHLQ);
            merged.pages[0] = { ...merged.pages[0], questions: updatedQs };
            console.log(`✅ Inserted HL Q1 (${firstHLQ.id}) after loanName`);
        }

        const extraPages: Page[] = [];
        if (restHLQ.length > 0) {
            extraPages.push({ ...homeLoan.pages[0], questions: restHLQ });
        }
        if (homeLoan.pages.length > 1) {
            extraPages.push(...homeLoan.pages.slice(1));
        }
        merged.pages.push(...extraPages);

        console.log("✅ Page 1 after merge:", merged.pages[0].questions.map(q => q.id));
        console.log("✅ Total pages after merge:", merged.pages.length);

        return { ...merged };
    }

    // ---- ACTIVE SCHEMA BUILDER ----
    function getActiveSchema(selectedLoan: string): Schema {
        console.log("🔸 getActiveSchema CALLED for:", selectedLoan);
        let finalSchema = preprocessSchemaBindings(baseSchema, selectedLoan) as Schema;

        // ✅ FIX: Check schema-level includeSchemaWhen
        if (baseSchema.includeSchemaWhen) {
            for (const rule of baseSchema.includeSchemaWhen) {
                const condResult = jsonLogic.apply(rule.condition, { loanName: selectedLoan });
                console.log("includeSchemaWhen check (root)", rule, "=>", condResult);

                if (condResult && rule.schemaFile === 'homeLoanSchema.json') {
                    const processedHL = preprocessSchemaBindings(homeLoanSchema, selectedLoan) as Schema;
                    finalSchema = mergeHomeLoanSplit(finalSchema, processedHL);
                }
            }
        }

        console.log("✅ Active schema pages:", finalSchema.pages.length);
        return { ...finalSchema };
    }

    // ---- FORM SUBMIT ----
    async function handleSubmit() {
        try {
            isSubmitting = true;
            submitError = null;
            const payload = { ...combinedAnswers, submissionDate: new Date().toISOString(), loanType: selectedLoan };
            const result = await submitApplication(payload);
            loanData.set({});
            await goto(`/application-success?id=${result.applicationId}`);
        } catch (error) {
            submitError = error instanceof Error ? error.message : 'Failed to submit application';
        } finally {
            isSubmitting = false;
        }
    }

    // ---- HELPERS ----
    $: stateOptions = Object.keys(pincode_IN_Selected).map(state => ({ label: state, value: state }));
    function getCityOptionsForState(s: string | undefined) {
        if (!s) return [];
        return Object.keys(pincode_IN_Selected[s] || {}).map(city => ({ label: city, value: city }));
    }
    $: residenceCityOptions = getCityOptionsForState(currentAnswers['residenceStateName']);
    $: businessCityOptions = getCityOptionsForState(currentAnswers['businessStateName']);
    $: showBusinessAddress = currentAnswers['addressSameOrNot'] === 'No';

    function sanitizeKey(v: string | undefined) { return v ? v.replace(/\s+/g, '_') : ''; }
    function resolveBindsTo(q: Question, answers: Answers, loan: string) {
        if (!q.bindsTo_template) return q.bindsTo || q.id;
        return q.bindsTo_template.replace(/\{([^}]+)\}/g, (_, key) => {
            if (key === 'q1_loanName') return sanitizeKey(loan);
            const val = answers[key];
            return typeof val === 'string' ? sanitizeKey(val) : (val?.toString() ?? '');
        });
    }
    function getOptionValue(val: any) {
        if (typeof val === 'object' && 'var' in val) return combinedAnswers[val.var] ?? '';
        return val;
    }

    // ---- INIT ----
    onMount(() => {
        selectedLoan = ($loanData && $loanData.loanName) || '';
        schema = getActiveSchema(selectedLoan);
    });
    $: schema = getActiveSchema(selectedLoan);
    $: currentAnswers = $loanData[selectedLoan] ?? {};

    $: combinedAnswers = (() => {
        const combined: Answers = {};
        for (const page of schema.pages) {
            for (const q of page.questions) {
                const key = resolveBindsTo(q, currentAnswers, selectedLoan);
                if (!key) continue;
                if (q.type === 'multiple-select') combined[key] = currentAnswers[key] ?? [];
                else if (q.type === 'number') combined[key] = currentAnswers[key] ?? null;
                else if (q.type === 'checkbox') combined[key] = currentAnswers[key] ?? false;
                else combined[key] = currentAnswers[key] ?? '';
                if (key.includes('_')) combined[key.split('_').pop() || ''] = combined[key];
                if ((q as any).contextKey) combined[(q as any).contextKey] = combined[key];
            }
        }
        combined['loanName'] = selectedLoan;
        combined['q1_loanName'] = selectedLoan;
        console.log("💾 Combined Answers:", combined);
        return combined;
    })();

    $: currentPage = schema.pages[currentPageIndex];
    function isQuestionVisible(q: Question, formData: Answers) {
        if (!q.showWhen) return true;
        const nd: Record<string, any> = {};
        for (const [k, v] of Object.entries(formData)) {
            nd[k] = v;
            nd[k.toLowerCase()] = v;
            nd[k.toUpperCase()] = v;
            nd[k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()] = v;
            if (k.includes('_')) nd[k.split('_').pop() || ''] = v;
        }
        if (q.bindsTo_template) {
            const k = resolveBindsTo(q, formData, formData.q1_loanName);
            if (formData[k] !== undefined) nd[k] = formData[k];
        }
        const result = jsonLogic.apply(q.showWhen, nd);
        console.log(`👁 Visibility check for ${q.id}`, "Data:", nd, "Result:", result);
        return result;
    }
    $: visibleQuestions = currentPage.questions.filter(q => isQuestionVisible(q, combinedAnswers));

    function updateAnswerByKey<T>(key: string, val: T) {
        loanData.update(data => {
            if (!data[selectedLoan]) data[selectedLoan] = {};
            data[selectedLoan][key] = val;
            data.loanName = selectedLoan;
            return data;
        });
    }
    function updateAnswer(q: Question, v: any) {
        console.log(`✏️ updateAnswer: ${q.id} =>`, v);
        if (q.id === 'q1_loanName') {
            selectedLoan = v as string;
            updateAnswerByKey('loanName', v);
            updateAnswerByKey('q1_loanName', v);
            schema = getActiveSchema(selectedLoan);
            currentPageIndex = 0;
        }
        updateAnswerByKey(resolveBindsTo(q, currentAnswers, selectedLoan), v);
    }

    function goNext() { if (currentPageIndex < schema.pages.length - 1) currentPageIndex++; }
    function goPrev() { if (currentPageIndex > 0) currentPageIndex--; }
    function allRequiredAnswered() {
        return currentPage.questions.filter(q => q.required && isQuestionVisible(q, combinedAnswers))
            .every(q => {
                const val = currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)];
                return q.type === 'multiple-select' ? Array.isArray(val) && val.length > 0 :
                    val !== undefined && val !== null && (typeof val !== 'string' || val !== '');
            });
    }
    function getValidationErrorMessage(q: Question, ans: Answers) {
        const val = ans[resolveBindsTo(q, ans, selectedLoan)];
        if (q.required && (val === undefined || val === null || (typeof val === 'string' && val === ''))) {
            return q.errorMessage?.required ?? 'This field is required';
        }
        return null;
    }

    $: isNextEnabled = currentPage.nextButtonVisibility
        ? currentPage.nextButtonVisibility.mode.includes('allRequiredAnswered') && allRequiredAnswered()
        : true;
    $: isLastPage = currentPageIndex === schema.pages.length - 1;
    $: canSubmit = isLastPage && schema.pages.every(p =>
        p.questions.filter(q => isQuestionVisible(q, combinedAnswers))
            .every(q => !q.required || (
                q.type === 'multiple-select'
                    ? Array.isArray(currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)]) &&
                      currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)].length > 0
                    : currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)] !== undefined &&
                      currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)] !== null &&
                      (typeof currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)] !== 'string' ||
                       currentAnswers[resolveBindsTo(q, combinedAnswers, selectedLoan)] !== '')
            ))
    );
</script>



<div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
	<div class="bg-white shadow-md rounded-lg p-6">
		<div class="mb-6">
			<h2 class="font-bold text-3xl">{currentPage.title}</h2>
		</div>

		{#each visibleQuestions as question (question.id)}
			<div class="mb-6">
				{#if question.type === 'radio'}
					<RadioField
						id={question.id}
						name={question.id}
						label={question.question}
						description={question.description}
						options={question.options ?? []}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value) => updateAnswer(question, value)}
						getOptionValue={(opt) => getOptionValue(opt.value).toString()}
						getOptionLabel={(opt) =>
							typeof opt.label === 'object' && opt.label.var
								? combinedAnswers[opt.label.var]?.toString() || opt.label.var
								: opt.label}
					/>
				{:else if question.type === 'text'}
					<TextField
						id={question.id}
						label={question.question}
						description={question.description}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						readonly={question.uiMeta?.readonly ?? false}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onInput={(value) => updateAnswer(question, value)}
					/>
				{:else if question.type === 'select'}
					<SelectField
						id={question.id}
						label={question.question}
						description={question.description}
						options={question.id === 'q1_residenceStateName' ||
						question.id === 'q4_businessStateName'
							? stateOptions
							: (question.options?.map((opt) => ({
									label: opt.label as string,
									value: opt.value as string | number
								})) ?? [])}
						value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value) => updateAnswer(question, value)}
						required={question.required ?? false}
						disabled={question.uiMeta?.readonly ?? false}
					/>
				{/if}
			</div>
		{/each}

		<div class="flex flex-col sm:flex-row justify-between mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
			<div>
				{#if currentPageIndex > 0}
					<button
						on:click={goPrev}
						class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md"
						>Previous</button
					>
				{/if}
			</div>
			<div class="flex flex-col items-center">
				{#if submitError}
					<p class="text-red-600 mb-2">{submitError}</p>
				{/if}
				{#if isLastPage}
					<button
						disabled={!canSubmit || isSubmitting}
						on:click={handleSubmit}
						class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-md disabled:opacity-50"
					>
						{#if isSubmitting}Submitting...{:else}Submit Application{/if}
					</button>
				{:else}
					<button
						disabled={!isNextEnabled}
						on:click={goNext}
						class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
					>
						Next
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
