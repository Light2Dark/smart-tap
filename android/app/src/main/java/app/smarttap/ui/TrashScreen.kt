package app.smarttap.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import app.smarttap.data.TapCard

@Composable
internal fun TrashList(
    cards: List<TapCard>,
    restoringId: Long?,
    onBack: () -> Unit,
    onRestore: (Long) -> Unit,
    modifier: Modifier = Modifier,
) {
    PaneScaffold(title = "Deleted cards", onBack = onBack, modifier = modifier) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 4.dp),
        ) {
            Text(
                "Deleted cards stop opening their link until you restore them.",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyLarge,
            )
            if (cards.isEmpty()) {
                Text(
                    "No deleted cards.",
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                )
            } else {
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(cards, key = { it.id }) { card ->
                        ListItem(
                            headlineContent = {
                                Text(card.title, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            },
                            supportingContent = {
                                Text(
                                    card.destinationUrl,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            },
                            trailingContent = {
                                val restoring = restoringId == card.id
                                TextButton(
                                    onClick = { if (restoringId == null) onRestore(card.id) },
                                    enabled = restoringId == null || restoring,
                                ) {
                                    if (restoring) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp,
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Text("Restoring")
                                    } else {
                                        Text("Restore")
                                    }
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}
