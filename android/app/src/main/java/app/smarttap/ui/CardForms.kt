package app.smarttap.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import app.smarttap.data.CardFormDraft
import app.smarttap.data.NEW_DESTINATION
import app.smarttap.data.TapCard
import app.smarttap.data.destinationError
import app.smarttap.data.editDestinationDraft
import app.smarttap.data.newCardFormDraft

@Composable
internal fun AddCardForm(
    error: String?,
    saving: Boolean,
    onBack: () -> Unit,
    onSave: (String, String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var title by rememberSaveable { mutableStateOf("") }
    var destination by rememberSaveable { mutableStateOf(NEW_DESTINATION) }
    var submitted by rememberSaveable { mutableStateOf("") }
    val draft = newCardFormDraft(title, destination)
    val draftKey = "$title\n$destination"
    val serverError = error?.takeIf { submitted.isNotEmpty() && submitted == draftKey && !saving }
    PaneScaffold(title = "New card", onBack = onBack, modifier = modifier) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CardFace(
                title = title.ifBlank { "New card" },
                modifier = Modifier.fillMaxWidth().aspectRatio(CARD_RATIO),
            )
            val titleProblem =
                if (title.isNotEmpty() && title.trim().length !in 1..80) {
                    "Give the card a title, up to 80 characters."
                } else {
                    null
                }
            val destinationProblem =
                if (destination.trim() != NEW_DESTINATION) destinationError(destination) else null
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                modifier = Modifier.fillMaxWidth(),
                enabled = !saving,
                singleLine = true,
                label = { Text("Title") },
                isError = titleProblem != null,
            )
            OutlinedTextField(
                value = destination,
                onValueChange = { destination = it },
                modifier = Modifier.fillMaxWidth(),
                enabled = !saving,
                singleLine = true,
                label = { Text("Destination") },
                isError = destinationProblem != null,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            )
            DraftStatus(
                draft = draft,
                problem = titleProblem ?: destinationProblem,
                serverError = serverError,
            )
            Button(
                onClick = {
                    if (!saving) {
                        submitted = draftKey
                        onSave(title, destination)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = draft.canSave || saving,
            ) {
                SaveButtonLabel(saving = saving)
            }
        }
    }
}

@Composable
internal fun EditCardForm(
    card: TapCard,
    error: String?,
    saving: Boolean,
    deleting: Boolean,
    onBack: () -> Unit,
    onSave: (String) -> Unit,
    onTrash: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var destination by rememberSaveable(card.id) { mutableStateOf(card.destinationUrl) }
    var submitted by rememberSaveable(card.id) { mutableStateOf("") }
    val draft = editDestinationDraft(destination, card.destinationUrl)
    val busy = saving || deleting
    val serverError = error?.takeIf { submitted.isNotEmpty() && submitted == destination && !busy }
    PaneScaffold(title = card.title, onBack = onBack, modifier = modifier) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CardFace(
                title = card.title,
                imageUrl = card.imageUrl,
                modifier = Modifier.fillMaxWidth().aspectRatio(CARD_RATIO),
            )
            OutlinedTextField(
                value = destination,
                onValueChange = { destination = it },
                modifier = Modifier.fillMaxWidth(),
                enabled = !busy,
                singleLine = true,
                label = { Text("Destination") },
                isError = draft.dirty && !draft.canSave,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            )
            DraftStatus(
                draft = draft,
                problem = if (draft.dirty) destinationError(destination) else null,
                serverError = serverError,
            )
            Button(
                onClick = {
                    if (!busy) {
                        submitted = destination
                        onSave(destination)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = (draft.canSave || saving) && !deleting,
            ) {
                SaveButtonLabel(saving = saving)
            }
            TextButton(
                onClick = { if (!busy) onTrash() },
                modifier = Modifier.align(Alignment.CenterHorizontally),
                enabled = !saving || deleting,
            ) {
                if (deleting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.error,
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("Deleting")
                } else {
                    Text("Delete this card", color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun SaveButtonLabel(saving: Boolean) {
    if (saving) {
        CircularProgressIndicator(
            modifier = Modifier.size(18.dp),
            strokeWidth = 2.dp,
            color = MaterialTheme.colorScheme.onPrimary,
        )
        Spacer(Modifier.width(8.dp))
        Text("Saving")
    } else {
        Text("Save")
    }
}

@Composable
private fun DraftStatus(
    draft: CardFormDraft,
    problem: String?,
    serverError: String?,
) {
    if (!draft.dirty && serverError == null) {
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        if (draft.dirty) {
            Text(
                "Unsaved changes",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        val detail = serverError ?: problem
        if (detail != null) {
            Text(detail, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
